import express from 'express';
import multer from 'multer';
import path from 'path';
import BookController from '../controllers/bookController.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    // Get original filename without extension
    const originalName = path.parse(file.originalname).name;
    const extension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, originalName + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const router = express.Router();

// Books routes
router.get('/', BookController.getBooks);
router.get('/:id', BookController.getBookById);
router.post('/', upload.single('cover_file'), BookController.createBook);
router.put('/:id', upload.single('cover_file'), BookController.updateBook);
router.delete('/:id', BookController.deleteBook);

// Categories routes  
router.get('/categories/all', BookController.getCategories);

export default router;