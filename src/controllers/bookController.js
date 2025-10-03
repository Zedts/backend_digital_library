import BookModel from '../models/Book.js';
import CategoryModel from '../models/Category.js';

class BookController {
  // Get all books with pagination and filters
  static async getBooks(req, res) {
    try {
      const { page = 1, limit = 10, search = '', category = '' } = req.query;
      
      const result = await BookModel.getBooksWithPagination(
        parseInt(page), 
        parseInt(limit), 
        search, 
        category
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

  // Get book by ID
  static async getBookById(req, res) {
    try {
      const { id } = req.params;
      const result = await BookModel.getBookById(id);

      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(404).json({ error: 'Book not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create new book
  static async createBook(req, res) {
    try {
      const { title, author, publisher, publish_year, stock, category_id } = req.body;

      // Validate input
      if (!title || !author) {
        return res.status(400).json({
          success: false,
          error: 'Title and author are required'
        });
      }

      const bookData = {
        title,
        author,
        publisher: publisher || '',
        publish_year: publish_year || new Date().getFullYear(),
        stock: stock || 0,
        category_id: category_id || null
      };

      const result = await BookModel.createBook(bookData);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update book
  static async updateBook(req, res) {
    try {
      const { id } = req.params;
      const { title, author, publisher, publish_year, stock, category_id } = req.body;

      // Validate input
      if (!title || !author) {
        return res.status(400).json({
          success: false,
          error: 'Title and author are required'
        });
      }

      const bookData = {
        title,
        author,
        publisher: publisher || '',
        publish_year: publish_year || new Date().getFullYear(),
        stock: stock || 0,
        category_id: category_id || null
      };

      const result = await BookModel.updateBook(id, bookData);

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete book
  static async deleteBook(req, res) {
    try {
      const { id } = req.params;
      const result = await BookModel.deleteBook(id);

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get all categories
  static async getCategories(req, res) {
    try {
      const result = await CategoryModel.getAllCategories();

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
}

export default BookController;