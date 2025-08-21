 
// import express from "express";
// import {auth} from "../middlewares/auth.js"
// import { generateArticle, generateBlogTitle, generateImage, RemoveImageBackground, removeImageObject, ResumeReview } from "../controllers/aiController.js";
// import { Upload } from "../configs/multer.js";  
// const aiRouter = express.Router();
// import upload from "../configs/multer.js";

// aiRouter.post('/generate-article',auth, generateArticle);
// aiRouter.post('/generate-blog-title',auth, generateBlogTitle);
// aiRouter.post('/generate-image',auth, generateImage);

// aiRouter.post('/remove-image-background' , Upload.single('image') , auth, 
// RemoveImageBackground);

// aiRouter.post('/remove-image-object' , Upload.single('image') , auth, 
// removeImageObject);

// aiRouter.post('/resume-review', Upload.single('resume'), auth, ResumeReview);

// export default aiRouter;
  

import express from "express";
import { auth } from "../middlewares/auth.js";
import { 
    generateArticle, 
    generateBlogTitle, 
    generateImage, 
    RemoveImageBackground, 
    removeImageObject, 
    ResumeReview 
} from "../controllers/aiController.js";
import { uploadImage, uploadPdf } from "../configs/multer.js"; // ✅ Use specific uploaders
import multer from "multer";

const aiRouter = express.Router();

console.log('🔧 Creating AI Router');

// Add route logging middleware
aiRouter.use((req, res, next) => {
  console.log(`📝 AI Route: ${req.method} ${req.path}`);
  next();
});

// Text & image generation routes
aiRouter.post("/generate-article", auth, generateArticle);
aiRouter.post("/generate-blog-title", auth, generateBlogTitle);
aiRouter.post("/generate-image", generateImage);

// Image processing routes
aiRouter.post(
  "/remove-image-background",
  auth,
  uploadImage.single("image"),
  (error, req, res, next) => {
    if (error) {
      if (error.name === 'MulterError') {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Image too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
    next();
  },
  RemoveImageBackground
);

aiRouter.post(
  "/remove-image-object",
  auth,
  uploadImage.single("image"),
  (error, req, res, next) => {
    if (error) {
      if (error.name === 'MulterError') {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Image too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
    next();
  },
  removeImageObject
);

// Resume review route
console.log('🔧 Registering resume-review route');
aiRouter.post("/resume-review", uploadPdf.single("resume"), (error, req, res, next) => {
  console.log('Multer error handler called with:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files uploaded.' });
    }
  }
  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  
  console.log('No multer errors, proceeding to ResumeReview controller');
  next();
}, ResumeReview);

console.log('✅ All AI routes registered');

export default aiRouter;
