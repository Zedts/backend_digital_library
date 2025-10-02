import { connectDBDigitalLibrary } from '../config/dbConnection.js';

class CategoryModel {
  // Get all categories
  static async getAllCategories() {
    try {
      const query = `SELECT category_id, category_name FROM Categories ORDER BY category_name`;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get total categories count
  static async getTotalCategories() {
    try {
      const query = `SELECT COUNT(*) as total FROM Categories`;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset[0].total };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get category with book count
  static async getCategoriesWithBookCount() {
    try {
      const query = `
        SELECT c.category_id, c.category_name, COUNT(b.book_id) as book_count
        FROM Categories c
        LEFT JOIN Books b ON c.category_id = b.category_id
        GROUP BY c.category_id, c.category_name
        ORDER BY c.category_name
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default CategoryModel;