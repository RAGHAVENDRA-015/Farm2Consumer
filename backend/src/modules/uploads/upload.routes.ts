import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { UploadController } from './upload.controller';
import { authenticate } from '../../middleware/auth.middleware';

const uploadDir = path.join(process.cwd(), 'uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `fl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

const router = Router();

router.use(authenticate);

router.post('/sign', UploadController.getSignature);
router.post('/', upload.single('file'), UploadController.upload);

export default router;
