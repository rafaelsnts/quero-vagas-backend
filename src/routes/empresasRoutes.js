import { Router } from "express";
import {
  getMeuPerfilEmpresa,
  updateMeuPerfilEmpresa,
  uploadLogoEmpresa,
} from "../controllers/empresasController.js";
import { uploadLogo } from "../config/multerConfig.js";
import { protect, isEmpresa } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/meu-perfil", protect, isEmpresa, getMeuPerfilEmpresa);
router.put("/meu-perfil", protect, isEmpresa, updateMeuPerfilEmpresa);
router.post(
  "/logo",
  protect,
  isEmpresa,
  uploadLogo.single("logo"),
  uploadLogoEmpresa
);

export default router;
