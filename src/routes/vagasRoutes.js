import { Router } from "express";
import {
  createVaga,
  getMinhasVagas,
  candidatarAVaga,
  getVagas,
  getVagaById,
  getVagaCandidatos,
  updateVaga,
  deleteVaga,
} from "../controllers/vagasController.js";
import {
  protect,
  isEmpresa,
  isCandidato,
} from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getVagas);

router.post("/", protect, isEmpresa, createVaga);

router.get("/minhas-vagas", protect, isEmpresa, getMinhasVagas);

router.get("/:id/candidatos", protect, isEmpresa, getVagaCandidatos);

router.post("/:id/candidatar", protect, isCandidato, candidatarAVaga);
router.put("/:id", protect, isEmpresa, updateVaga);

router.get("/:id", getVagaById);
router.delete("/:id", protect, isEmpresa, deleteVaga);

export default router;
