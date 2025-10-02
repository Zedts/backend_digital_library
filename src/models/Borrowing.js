import { connectDBDigitalLibrary } from '../config/dbConnection.js';

class BorrowingModel {
  // Get total active borrowings
  static async getActiveBorrowings() {
    try {
      const query = `SELECT COUNT(*) as total FROM Borrowings WHERE status = 'Borrowed'`;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset[0].total };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get total pending requests
  static async getPendingRequests() {
    try {
      const query = `SELECT COUNT(*) as total FROM Borrowings WHERE status = 'Pending'`;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset[0].total };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get users active borrowings
  static async getUserActiveBorrowings(userId) {
    try {
      const query = `
        SELECT br.borrowing_id, br.borrow_date, br.due_date, br.status,
               b.title, b.author
        FROM Borrowings br
        JOIN Books b ON br.book_id = b.book_id
        WHERE br.users_id = ${userId} AND br.status IN ('Borrowed', 'Extended')
        ORDER BY br.borrow_date DESC
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get user's pending requests
  static async getUserPendingRequests(userId) {
    try {
      const query = `
        SELECT br.borrowing_id, br.borrow_date, br.status,
               b.title, b.author
        FROM Borrowings br
        JOIN Books b ON br.book_id = b.book_id
        WHERE br.users_id = ${userId} AND br.status = 'Pending'
        ORDER BY br.borrow_date DESC
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get users borrowing history
  static async getUserBorrowingHistory(userId) {
    try {
      const query = `
        SELECT br.borrowing_id, br.borrow_date, br.due_date, br.status,
               b.title, b.author, r.return_date, r.fine,
               ISNULL(rp.progress_percentage, 0) as progress_percentage
        FROM Borrowings br
        JOIN Books b ON br.book_id = b.book_id
        LEFT JOIN Returns r ON br.borrowing_id = r.borrowing_id
        LEFT JOIN ReadingProgress rp ON br.borrowing_id = rp.borrowing_id
        WHERE br.users_id = ${userId}
        ORDER BY br.borrow_date DESC
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get recent activities for admin (last 10 activities)
  static async getRecentActivities() {
    try {
      const query = `
        SELECT TOP 10 
               br.borrowing_id, br.borrow_date, br.due_date, br.status,
               b.title as book_title, u.name as user_name,
               r.return_date, r.fine
        FROM Borrowings br
        JOIN Books b ON br.book_id = b.book_id
        JOIN Users u ON br.users_id = u.users_id
        LEFT JOIN Returns r ON br.borrowing_id = r.borrowing_id
        ORDER BY 
          CASE 
            WHEN r.return_date IS NOT NULL THEN r.return_date
            ELSE br.borrow_date
          END DESC
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get overdue borrowings
  static async getOverdueBorrowings() {
    try {
      const query = `
        SELECT br.borrowing_id, br.borrow_date, br.due_date, br.status,
               b.title as book_title, u.name as user_name,
               DATEDIFF(day, br.due_date, GETDATE()) as days_overdue
        FROM Borrowings br
        JOIN Books b ON br.book_id = b.book_id
        JOIN Users u ON br.users_id = u.users_id
        WHERE br.status = 'Borrowed' AND br.due_date < GETDATE()
        ORDER BY br.due_date ASC
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get count of overdue books
  static async getOverdueBooksCount() {
    try {
      const query = `
        SELECT COUNT(*) as total 
        FROM Borrowings 
        WHERE status = 'Borrowed' AND due_date < GETDATE()
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset[0].total };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get count of books due today
  static async getDueTodayCount() {
    try {
      const query = `
        SELECT COUNT(*) as total 
        FROM Borrowings 
        WHERE status = 'Borrowed' AND CAST(due_date as DATE) = CAST(GETDATE() as DATE)
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset[0].total };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default BorrowingModel;