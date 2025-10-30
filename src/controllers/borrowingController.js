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

  // Get user borrowings with pagination
  static async getUserBorrowings(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const result = await BorrowingModel.getUserBorrowingsWithPagination(
        parseInt(userId),
        parseInt(page), 
        parseInt(limit)
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

  // Create new borrowing (user request)
  static async createBorrowing(req, res) {
    try {
      const { users_id, book_id, borrow_date, due_date, quantity = 1, notes } = req.body;
      
      // Check if book is available and has enough stock
      const bookResult = await BookModel.getBookById(book_id);
      if (!bookResult.success) {
        return res.status(404).json({ error: 'Book not found' });
      }
      
      if (bookResult.data.stock <= 0) {
        return res.status(400).json({ error: 'Book is not available for borrowing' });
      }
      
      if (quantity > bookResult.data.stock) {
        return res.status(400).json({ error: `Only ${bookResult.data.stock} copies available` });
      }
      
      if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }

      const borrowingData = {
        users_id,
        book_id,
        quantity: parseInt(quantity),
        notes,
        borrow_date: borrow_date || new Date().toISOString().split('T')[0],
        due_date: due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

      // If approving, reduce book stock by quantity
      if (status === 'Borrowed') {
        const borrowingResult = await BorrowingModel.getBorrowingById(id);
        if (borrowingResult.success) {
          const bookId = borrowingResult.data.book_id;
          const quantity = borrowingResult.data.quantity || 1;
          await BookModel.updateBookStock(bookId, -quantity);
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

  // Return book (user request to return)
  static async returnBook(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      const updateData = {
        status: 'Waiting Return',
        notes: notes || 'User requested to return book'
      };

      const result = await BorrowingModel.updateBorrowing(id, updateData);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Return request submitted successfully'
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Approve return (admin confirms return)
  static async approveReturn(req, res) {
    try {
      const { id } = req.params;
      const { notes, fine = 0, approved_by } = req.body;
      
      const updateData = {
        status: 'Returned',
        return_date: new Date().toISOString().split('T')[0],
        notes: notes || 'Return approved by admin',
        approved_by,
        approved_date: new Date().toISOString()
      };

      const result = await BorrowingModel.updateBorrowing(id, updateData);

      if (result.success) {
        // Increase book stock back by quantity
        const borrowingResult = await BorrowingModel.getBorrowingById(id);
        if (borrowingResult.success) {
          const bookId = borrowingResult.data.book_id;
          const quantity = borrowingResult.data.quantity || 1;
          await BookModel.updateBookStock(bookId, quantity);
        }

        // Add return record if fine exists
        if (fine > 0) {
          await BorrowingModel.addReturnRecord(id, fine);
        }

        res.json({
          success: true,
          data: result.data,
          message: 'Return approved successfully'
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Reject return (admin rejects return request)
  static async rejectReturn(req, res) {
    try {
      const { id } = req.params;
      const { notes, approved_by } = req.body;
      
      // Get current borrowing to restore previous status
      const borrowingResult = await BorrowingModel.getBorrowingById(id);
      if (!borrowingResult.success) {
        return res.status(404).json({ error: 'Borrowing not found' });
      }

      // Restore to Borrowed status
      const updateData = {
        status: 'Borrowed',
        notes: notes || 'Return request rejected by admin',
        approved_by,
        approved_date: new Date().toISOString()
      };

      const result = await BorrowingModel.updateBorrowing(id, updateData);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Return request rejected'
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