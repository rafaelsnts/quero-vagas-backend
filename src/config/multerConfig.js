import multer from "multer";
import path from "path";

const createStorage = (folder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `public/uploads/${folder}/`);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`
      );
    },
  });
};

const docFileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo de arquivo inválido. Apenas PDF e DOC/DOCX são permitidos."
      ),
      false
    );
  }
};

const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/pjpeg", "image/png", "image/gif"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Tipo de arquivo inválido. Apenas imagens são permitidas."),
      false
    );
  }
};

export const uploadCurriculo = multer({
  storage: createStorage("curriculos"),
  fileFilter: docFileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

export const uploadLogo = multer({
  storage: createStorage("logos"),
  fileFilter: imageFileFilter,
  limits: { fileSize: 1024 * 1024 * 2 },
});
