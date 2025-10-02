import { connectDBDigitalLibrary } from '../config/dbConnection.js';

class BookModel {
  // Get total books count
  static async getTotalBooks() {
    try {
      const query = `SELECT COUNT(*) as total FROM Books`;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset[0].total };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get books with categories
  static async getBooksWithCategories() {
    try {
      const query = `
        SELECT b.book_id, b.title, b.author, b.publisher, b.publish_year, 
               b.stock, c.category_name
        FROM Books b
        LEFT JOIN Categories c ON b.category_id = c.category_id
        ORDER BY b.title
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get book by ID
  static async getBookById(bookId) {
    try {
      const query = `
        SELECT b.book_id, b.title, b.author, b.publisher, b.publish_year, 
               b.stock, c.category_name
        FROM Books b
        LEFT JOIN Categories c ON b.category_id = c.category_id
        WHERE b.book_id = ${bookId}
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get available books (stock > 0)
  static async getAvailableBooks() {
    try {
      const query = `
        SELECT b.book_id, b.title, b.author, b.publisher, b.publish_year, 
               b.stock, c.category_name
        FROM Books b
        LEFT JOIN Categories c ON b.category_id = c.category_id
        WHERE b.stock > 0
        ORDER BY b.title
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default BookModel;