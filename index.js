import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./src/routes/authRoutes.js";
import vagasRoutes from "./src/routes/vagasRoutes.js";
import perfilRoutes from "./src/routes/perfilRoutes.js";
import empresasRoutes from "./src/routes/empresasRoutes.js";
import candidaturasRoutes from "./src/routes/candidaturasRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

app.use(
  cors({
    origin: [
      "https://quero-vagas-frontend.onrender.com",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/files", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Muitas requisições deste IP, tente novamente em 15 minutos.",
});
app.use(limiter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API funcionando!",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/vagas", vagasRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/empresas", empresasRoutes);
app.use("/api/perfis", perfilRoutes);
app.use("/api/candidaturas", candidaturasRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `📊 Database connected: ${process.env.DATABASE_URL ? "Yes" : "No"}`
  );

  console.log(`📁 Static files served from: ${path.join(__dirname, "public")}`);
  console.log(`🖼️ Images accessible at: http://localhost:${PORT}/uploads/`);
});

export default app;
