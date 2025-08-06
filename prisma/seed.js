import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const stripePriceIdProfissional = "price_1RqNhLE1auyzaMj9UJIKt0i5";

  await prisma.plano.upsert({
    where: { id: "basico" },
    update: {},
    create: {
      id: "basico",
      nome: "Plano Básico",
      preco: 0.0,
      limiteVagas: 1,
      stripePriceId: "plano_gratuito",
    },
  });

  await prisma.plano.upsert({
    where: { id: "profissional" },
    update: {},
    create: {
      id: "profissional",
      nome: "Plano Profissional",
      preco: 99.0,
      limiteVagas: 5,
      stripePriceId: stripePriceIdProfissional,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
