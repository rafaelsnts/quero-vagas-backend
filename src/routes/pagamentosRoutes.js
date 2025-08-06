import express from "express";
import {
  createCheckoutSession,
  verificarPagamento,
  buscarAssinaturaAtual,
} from "../controllers/pagamentosController.js";
import { protect, isEmpresa } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/create-checkout-session",
  protect,
  isEmpresa,
  createCheckoutSession
);
router.post("/verificar-pagamento", protect, isEmpresa, verificarPagamento);
router.get("/assinatura-atual", protect, isEmpresa, buscarAssinaturaAtual);

export default router;
