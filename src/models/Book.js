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

  // Get books with pagination and search
  static async getBooksWithPagination(page = 1, limit = 10, search = '', category = '') {
    try {
      const offset = (page - 1) * limit;
      let whereConditions = [];
      
      if (search) {
        whereConditions.push(`(b.title LIKE '%${search}%' OR b.author LIKE '%${search}%' OR b.publisher LIKE '%${search}%')`);
      }
      
      if (category) {
        whereConditions.push(`c.category_id = ${category}`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT b.book_id, b.title, b.author, b.publisher, b.publish_year, 
               b.stock, c.category_name, c.category_id,
               (SELECT COUNT(*) FROM Borrowings br WHERE br.book_id = b.book_id AND br.status = 'Borrowed') as borrowed_count
        FROM Books b
        LEFT JOIN Categories c ON b.category_id = c.category_id
        ${whereClause}
        ORDER BY b.title
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM Books b
        LEFT JOIN Categories c ON b.category_id = c.category_id
        ${whereClause}
      `;

      const [result, countResult] = await Promise.all([
        connectDBDigitalLibrary(query),
        connectDBDigitalLibrary(countQuery)
      ]);

      return { 
        success: true, 
        data: result.recordset,
        pagination: {
          current_page: page,
          per_page: limit,
          total: countResult.recordset[0].total,
          last_page: Math.ceil(countResult.recordset[0].total / limit)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create new book
  static async createBook(bookData) {
    try {
      const { title, author, publisher, publish_year, stock, category_id } = bookData;
      const query = `
        INSERT INTO Books (title, author, publisher, publish_year, stock, category_id)
        VALUES ('${title}', '${author}', '${publisher}', ${publish_year}, ${stock}, ${category_id})
      `;
      await connectDBDigitalLibrary(query);
      return { success: true, message: 'Book created successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update book
  static async updateBook(bookId, bookData) {
    try {
      const { title, author, publisher, publish_year, stock, category_id } = bookData;
      const query = `
        UPDATE Books 
        SET title = '${title}', author = '${author}', publisher = '${publisher}', 
            publish_year = ${publish_year}, stock = ${stock}, category_id = ${category_id}
        WHERE book_id = ${bookId}
      `;
      await connectDBDigitalLibrary(query);
      return { success: true, message: 'Book updated successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete book
  static async deleteBook(bookId) {
    try {
      // Check if book has active borrowings
      const checkQuery = `
        SELECT COUNT(*) as count 
        FROM Borrowings 
        WHERE book_id = ${bookId} AND status IN ('Borrowed', 'Pending')
      `;
      const checkResult = await connectDBDigitalLibrary(checkQuery);
      
      if (checkResult.recordset[0].count > 0) {
        return { success: false, error: 'Cannot delete book with active borrowings' };
      }

      const query = `DELETE FROM Books WHERE book_id = ${bookId}`;
      await connectDBDigitalLibrary(query);
      return { success: true, message: 'Book deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default BookModel;