import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../common/errors/AppError';

const uploadDir = path.resolve(process.cwd(), 'uploads');
const thumbsDir = path.resolve(uploadDir, 'thumbnails');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(thumbsDir)) {
  fs.mkdirSync(thumbsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `proof-${uniqueSuffix}${ext}`);
  },
});

export const uploadProof = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only image files (JPEG, PNG, WebP, GIF) are allowed'));
    }
  },
});
