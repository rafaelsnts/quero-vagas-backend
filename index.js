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
const app = express();

const publicDir = path.join(__dirname, "public");
const uploadsDir = path.join(publicDir, "uploads");
const logosDir = path.join(uploadsDir, "logos");

[publicDir, uploadsDir, logosDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.post(
  "/api/pagamentos/stripe-webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

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

app.use(express.json());

app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Cache-Control", "public, max-age=31536000");

    console.log(`🖼️ Servindo arquivo: ${req.path}`);
    next();
  },
  express.static(path.join(__dirname, "public/uploads"))
);

app.use("/files", express.static(path.join(__dirname, "public")));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
      },
    },
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get("/api/debug/uploads", (req, res) => {
  try {
    const logosPath = path.join(__dirname, "public/uploads/logos");

    if (!fs.existsSync(logosPath)) {
      return res.json({
        error: "Pasta de logos não existe",
        path: logosPath,
        files: [],
      });
    }

    const files = fs.readdirSync(logosPath);

    res.json({
      uploadsPath: path.join(__dirname, "public/uploads"),
      logosPath: logosPath,
      files: files,
      fullUrls: files.map((file) => `/uploads/logos/${file}`),
      testUrls: files.map(
        (file) => `${req.protocol}://${req.get("host")}/uploads/logos/${file}`
      ),
    });
  } catch (error) {
    console.error("❌ Erro ao listar arquivos:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/test-logo/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "public/uploads/logos", filename);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    res.json({
      exists: true,
      path: filePath,
      size: stats.size,
      url: `/uploads/logos/${filename}`,
      fullUrl: `${req.protocol}://${req.get("host")}/uploads/logos/${filename}`,
    });
  } else {
    res.status(404).json({
      exists: false,
      path: filePath,
      message: "Arquivo não encontrado",
    });
  }
});

app.get("/api/logo-exists/:filename", async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "public/uploads/logos", filename);

  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);

      const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const ext = path.extname(filename).toLowerCase();

      if (!validExtensions.includes(ext)) {
        return res.status(400).json({
          exists: false,
          error: "Arquivo não é uma imagem válida",
          extension: ext,
        });
      }

      res.json({
        exists: true,
        filename: filename,
        size: stats.size,
        extension: ext,
        url: `/uploads/logos/${filename}`,
        fullUrl: `${req.protocol}://${req.get(
          "host"
        )}/uploads/logos/${filename}`,
        lastModified: stats.mtime,
      });
    } else {
      res.status(404).json({
        exists: false,
        filename: filename,
        path: filePath,
      });
    }
  } catch (error) {
    console.error("❌ Erro ao verificar logo:", error);
    res.status(500).json({
      exists: false,
      error: error.message,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/vagas", vagasRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/empresas", empresasRoutes);
app.use("/api/candidaturas", candidaturasRoutes);
app.use("/api/pagamentos", pagamentosRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uploadsDir: path.join(__dirname, "public/uploads"),
    logosDir: path.join(__dirname, "public/uploads/logos"),
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Public directory: ${publicDir}`);
  console.log(`🖼️ Logos directory: ${logosDir}`);
  console.log(`🔗 Test uploads: http://localhost:${PORT}/api/debug/uploads`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `💳 Stripe webhook endpoint: http://localhost:${PORT}/api/pagamentos/stripe-webhook`
  );
});

export default app;
