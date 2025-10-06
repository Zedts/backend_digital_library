import BorrowingModel from '../models/Borrowing.js';
import BookModel from '../models/Book.js';
import UserModel from '../models/User.js';

class BorrowingController {
  // Get all borrowings with pagination and filters
  static async getBorrowings(req, res) {
    try {
      const { page = 1, limit = 10, status = '', search = '' } = req.query;
      
      const result = await BorrowingModel.getBorrowingsWithPagination(
        parseInt(page), 
        parseInt(limit), 
        status,
        search
      );

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          pagination: result.pagination
        });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get borrowing by ID
  static async getBorrowingById(req, res) {
    try {
      const { id } = req.params;
      const result = await BorrowingModel.getBorrowingById(id);

      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(404).json({ error: 'Borrowing not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create new borrowing (user request)
  static async createBorrowing(req, res) {
    try {
      const { users_id, book_id, notes } = req.body;
      
      // Check if book is available
      const bookResult = await BookModel.getBookById(book_id);
      if (!bookResult.success || bookResult.data.stock <= 0) {
        return res.status(400).json({ error: 'Book is not available for borrowing' });
      }

      const borrowingData = {
        users_id,
        book_id,
        notes,
        borrow_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        status: 'Pending'
      };

      const result = await BorrowingModel.createBorrowing(borrowingData);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: 'Borrowing request created successfully'
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update borrowing status (approve/reject)
  static async updateBorrowingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, approved_by, notes } = req.body;
      
      const updateData = {
        status,
        approved_by,
        notes,
        approved_date: new Date().toISOString()
      };

      // If approving, reduce book stock
      if (status === 'Borrowed') {
        const borrowingResult = await BorrowingModel.getBorrowingById(id);
        if (borrowingResult.success) {
          const bookId = borrowingResult.data.book_id;
          await BookModel.updateBookStock(bookId, -1);
        }
      }

      const result = await BorrowingModel.updateBorrowing(id, updateData);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Borrowing ${status.toLowerCase()} successfully`
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Return book
  static async returnBook(req, res) {
    try {
      const { id } = req.params;
      const { notes, fine = 0 } = req.body;
      
      const updateData = {
        status: 'Returned',
        return_date: new Date().toISOString().split('T')[0],
        notes
      };

      const result = await BorrowingModel.updateBorrowing(id, updateData);

      if (result.success) {
        // Increase book stock back
        const borrowingResult = await BorrowingModel.getBorrowingById(id);
        if (borrowingResult.success) {
          const bookId = borrowingResult.data.book_id;
          await BookModel.updateBookStock(bookId, 1);
        }

        // Add return record if fine exists
        if (fine > 0) {
          await BorrowingModel.addReturnRecord(id, fine);
        }

        res.json({
          success: true,
          data: result.data,
          message: 'Book returned successfully'
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Extend borrowing period
  static async extendBorrowing(req, res) {
    try {
      const { id } = req.params;
      const { extension_days = 7, notes, approved_by } = req.body;
      
      // Get current borrowing data
      const borrowingResult = await BorrowingModel.getBorrowingById(id);
      if (!borrowingResult.success) {
        return res.status(404).json({ error: 'Borrowing not found' });
      }

      const currentDueDate = new Date(borrowingResult.data.due_date);
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + parseInt(extension_days));

      const updateData = {
        status: 'Extended',
        due_date: newDueDate.toISOString().split('T')[0],
        notes: notes || `Extended by ${extension_days} days`,
        approved_by,
        approved_date: new Date().toISOString()
      };

      const result = await BorrowingModel.updateBorrowingWithDueDate(id, updateData);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Borrowing extended by ${extension_days} days successfully`
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get borrowing statistics
  static async getBorrowingStats(req, res) {
    try {
      const result = await BorrowingModel.getBorrowingStats();

      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete borrowing (admin only - for rejecting requests)
  static async deleteBorrowing(req, res) {
    try {
      const { id } = req.params;
      
      const result = await BorrowingModel.deleteBorrowing(id);

      if (result.success) {
        res.json({
          success: true,
          message: 'Borrowing deleted successfully'
        });
      } else {
        res.status(404).json({ error: 'Borrowing not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default BorrowingController;