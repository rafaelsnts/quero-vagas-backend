import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import authRoutes from "./src/routes/authRoutes.js";
import vagasRoutes from "./src/routes/vagasRoutes.js";
import perfilRoutes from "./src/routes/perfilRoutes.js";
import empresasRoutes from "./src/routes/empresasRoutes.js";
import candidaturasRoutes from "./src/routes/candidaturasRoutes.js";
import pagamentosRoutes from "./src/routes/pagamentosRoutes.js";
import { handleStripeWebhook } from "./src/controllers/pagamentosController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
console.log("DATABASE_URL EM USO PELO SERVIDOR:", process.env.DATABASE_URL);
const app = express();

const publicDir = path.join(__dirname, "public");
const uploadsDir = path.join(publicDir, "uploads");
const logosDir = path.join(uploadsDir, "logos");
[publicDir, uploadsDir, logosDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use(
  cors({
    origin: [
      "https://quero-vagas-frontend.onrender.com",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.post(
  "/api/pagamentos/stripe-webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/files", express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/vagas", vagasRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/empresas", empresasRoutes);
app.use("/api/candidaturas", candidaturasRoutes);
app.use("/api/pagamentos", pagamentosRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
