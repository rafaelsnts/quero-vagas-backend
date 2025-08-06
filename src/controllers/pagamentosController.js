import Stripe from "stripe";
import { prisma } from "../database/client.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getBaseUrl = () =>
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:5173";
const getSuccessUrl = (sessionId) =>
  `${getBaseUrl()}/checkout-success?session_id=${sessionId}`;
const getCancelUrl = () => `${getBaseUrl()}/planos`;

export const createCheckoutSession = async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.id;

    const perfilEmpresa = await prisma.perfilEmpresa.findUnique({
      where: { userId: userId },
      include: { user: { select: { email: true } } },
    });

    if (!perfilEmpresa) {
      return res
        .status(404)
        .json({ error: { message: "Perfil de empresa não encontrado." } });
    }

    const plano = await prisma.plano.findUnique({
      where: { stripePriceId: priceId },
    });

    if (!plano) {
      return res.status(404).json({
        error: { message: "Plano não encontrado para o Price ID fornecido." },
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: getSuccessUrl("{CHECKOUT_SESSION_ID}"),
      cancel_url: getCancelUrl(),
      client_reference_id: perfilEmpresa.id.toString(),
      customer_email: perfilEmpresa.user.email,
      metadata: {
        perfilEmpresaId: perfilEmpresa.id.toString(),
        planoId: plano.id,
      },
      subscription_data: {
        metadata: {
          perfilEmpresaId: perfilEmpresa.id.toString(),
          planoId: plano.id,
        },
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    res
      .status(500)
      .json({ error: { message: "Erro ao iniciar o processo de pagamento." } });
  }
};

export const verificarPagamento = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    const perfilEmpresa = await prisma.perfilEmpresa.findUnique({
      where: { userId },
    });
    if (!perfilEmpresa) {
      return res
        .status(404)
        .json({ error: { message: "Perfil de empresa não encontrado." } });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (parseInt(session.client_reference_id) !== perfilEmpresa.id) {
      return res
        .status(403)
        .json({ error: { message: "Acesso negado a esta sessão." } });
    }

    if (session.payment_status === "paid") {
      const planoId = session.metadata.planoId;
      const planoComprado = await prisma.plano.findUnique({
        where: { id: planoId },
      });
      return res.json({ status: "success", plano: planoComprado });
    } else {
      return res.json({ status: "processing" });
    }
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error);
    res
      .status(500)
      .json({ error: { message: "Erro ao verificar status do pagamento." } });
  }
};
export const buscarAssinaturaAtual = async (req, res) => {
  try {
    const userId = req.user.id;
    const perfilEmpresa = await prisma.perfilEmpresa.findUnique({
      where: { userId },
    });

    if (!perfilEmpresa) {
      return res.json(null);
    }

    const assinatura = await prisma.assinatura.findUnique({
      where: { empresaId: perfilEmpresa.id },
      include: { plano: true },
    });

    res.json(assinatura);
  } catch (error) {
    console.error("Erro ao buscar assinatura atual:", error);
    res.status(500).json({ error: { message: "Erro ao buscar assinatura." } });
  }
};

const manageSubscriptionInDB = async (subscription) => {
  const perfilEmpresaId = parseInt(subscription.metadata.perfilEmpresaId);
  const planoId = subscription.metadata.planoId;

  if (!perfilEmpresaId || !planoId) {
    throw new Error(`Metadados incompletos na subscrição: ${subscription.id}`);
  }

  const dataInicio = new Date(
    (subscription.current_period_start || subscription.created) * 1000
  );

  const dataFim = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  if (isNaN(dataInicio.getTime()) || (dataFim && isNaN(dataFim.getTime()))) {
    throw new Error(
      "Data de início ou fim da assinatura inválida recebida do Stripe."
    );
  }

  const assinaturaData = {
    planoId: planoId,
    status: subscription.status,
    dataInicio: dataInicio,
    dataFim: dataFim,
    gatewaySubscriptionId: subscription.id,
    gatewayCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
  };

  await prisma.assinatura.upsert({
    where: { empresaId: perfilEmpresaId },
    update: assinaturaData,
    create: {
      empresaId: perfilEmpresaId,
      ...assinaturaData,
    },
  });
};

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(
      `[WEBHOOK ERROR] Falha na verificação da assinatura: ${err.message}`
    );
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
          await manageSubscriptionInDB(subscription);
        }
        break;

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "invoice.payment_succeeded":
        const subscriptionId = event.data.object.subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          await manageSubscriptionInDB(subscription);
        }
        break;

      default:
    }
  } catch (error) {
    console.error(
      `[WEBHOOK PROCESSING ERROR] Erro ao processar webhook ${event.type}:`,
      error
    );
    return res
      .status(400)
      .json({ error: "Falha no processamento do webhook." });
  }

  res.json({ received: true });
};
