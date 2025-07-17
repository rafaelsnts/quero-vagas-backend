import { Router } from "express";

import {
  registerCandidate,
  registerCompany,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = Router();

router.post("/register/candidate", registerCandidate);
router.post("/register/company", registerCompany);

router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
