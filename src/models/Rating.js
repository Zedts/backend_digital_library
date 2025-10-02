import { connectDBDigitalLibrary } from '../config/dbConnection.js';

class RatingModel {
  // Get book recommendations based on ratings (top rated books)
  static async getBookRecommendations(limit = 5) {
    try {
      const query = `
        SELECT TOP ${limit} 
               b.book_id, b.title, b.author,
               AVG(CAST(r.rating AS FLOAT)) as avg_rating,
               COUNT(r.rating_id) as rating_count
        FROM Books b
        LEFT JOIN Ratings r ON b.book_id = r.book_id
        WHERE b.stock > 0
        GROUP BY b.book_id, b.title, b.author
        HAVING COUNT(r.rating_id) > 0
        ORDER BY AVG(CAST(r.rating AS FLOAT)) DESC, COUNT(r.rating_id) DESC
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get user's bookmarks
  static async getUserBookmarks(userId) {
    try {
      const query = `
        SELECT bm.bookmark_id, bm.bookmark_date,
               b.book_id, b.title, b.author
        FROM Bookmarks bm
        JOIN Books b ON bm.book_id = b.book_id
        WHERE bm.users_id = ${userId}
        ORDER BY bm.bookmark_date DESC
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get book rating by book ID
  static async getBookRating(bookId) {
    try {
      const query = `
        SELECT AVG(CAST(rating AS FLOAT)) as avg_rating,
               COUNT(rating_id) as rating_count
        FROM Ratings
        WHERE book_id = ${bookId}
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default RatingModel;