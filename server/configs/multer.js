import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || (file.mimetype === 'application/pdf' ? '.pdf' : '.bin');
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Separate upload middlewares for images and PDFs
export const uploadImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== 'image') return cb(new Error('Expected field "image"'), false);
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for images
  }
});

export const uploadPdf = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== 'resume') return cb(new Error('Expected field "resume"'), false);
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for PDFs
  }
});

// Backward export for any legacy imports
export const upload = uploadPdf;

