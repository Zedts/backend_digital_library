import express from 'express';
import BookController from '../controllers/bookController.js';

const router = express.Router();

// Books routes
router.get('/', BookController.getBooks);
router.get('/:id', BookController.getBookById);
router.post('/', BookController.createBook);
router.put('/:id', BookController.updateBook);
router.delete('/:id', BookController.deleteBook);

// Categories routes  
router.get('/categories/all', BookController.getCategories);

export default router;