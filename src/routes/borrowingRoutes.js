import express from 'express';
import BorrowingController from '../controllers/borrowingController.js';

const router = express.Router();

router.get('/', BorrowingController.getBorrowings);
router.get('/stats', BorrowingController.getBorrowingStats);
router.get('/:id', BorrowingController.getBorrowingById);
router.post('/', BorrowingController.createBorrowing);
router.put('/:id/status', BorrowingController.updateBorrowingStatus);
router.put('/:id/return', BorrowingController.returnBook);
router.put('/:id/extend', BorrowingController.extendBorrowing);
router.delete('/:id', BorrowingController.deleteBorrowing);

export default router;