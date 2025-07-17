import { Router } from "express";
import {
  updateStatusCandidatura,
  getMinhasCandidaturas,
} from "../controllers/candidaturasController.js";
import {
  protect,
  isEmpresa,
  isCandidato,
} from "../middleware/authMiddleware.js";

const router = Router();

router.get("/minhas-candidaturas", protect, isCandidato, getMinhasCandidaturas);
router.put("/:id/status", protect, isEmpresa, updateStatusCandidatura);

export default router;
