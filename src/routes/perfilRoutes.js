import { Router } from "express";
import {
  getMeuPerfil,
  updateMeuPerfil,
  addExperiencia,
  addFormacaoAcademica,
  deleteExperiencia,
  deleteFormacaoAcademica,
  updateExperiencia,
  updateFormacaoAcademica,
  uploadCurriculo as uploadCurriculoController,
  getPerfilById,
} from "../controllers/perfilController.js";
import {
  protect,
  isCandidato,
  isEmpresa,
} from "../middleware/authMiddleware.js";

import { uploadCurriculo } from "../config/multerConfig.js";

const router = Router();

router.get("/meu-perfil", protect, isCandidato, getMeuPerfil);
router.put("/meu-perfil", protect, isCandidato, updateMeuPerfil);
router.post("/experiencia", protect, isCandidato, addExperiencia);
router.post("/formacao", protect, isCandidato, addFormacaoAcademica);
router.delete("/experiencia/:id", protect, isCandidato, deleteExperiencia);
router.delete("/formacao/:id", protect, isCandidato, deleteFormacaoAcademica);
router.put("/experiencia/:id", protect, isCandidato, updateExperiencia);
router.put("/formacao/:id", protect, isCandidato, updateFormacaoAcademica);
router.get("/:id", protect, isEmpresa, getPerfilById);
router.post(
  "/curriculo",
  protect,
  isCandidato,
  uploadCurriculo.single("curriculo"),
  uploadCurriculoController
);
router.get("/:id", protect, isEmpresa, getPerfilById);

export default router;
