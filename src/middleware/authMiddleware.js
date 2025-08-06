import jwt from "jsonwebtoken";
import { prisma } from "../database/client.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, nome: true, email: true, tipoUsuario: true },
      });

      next();
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ message: "Não autorizado, token inválido." });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Não autorizado, token não encontrado." });
  }
};

export const isEmpresa = (req, res, next) => {
  if (req.user && req.user.tipoUsuario === "EMPRESA") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Acesso negado. Rota exclusiva para empresas." });
  }
};

export const isCandidato = (req, res, next) => {
  if (req.user && req.user.tipoUsuario === "CANDIDATO") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Acesso negado. Rota exclusiva para candidatos." });
  }
};
