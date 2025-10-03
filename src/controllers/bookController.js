import BookModel from '../models/Book.js';
import CategoryModel from '../models/Category.js';

class BookController {
  // Get all books with pagination and filters
  static async getBooks(req, res) {
    try {
      const { page = 1, limit = 10, search = '', category = '', stock = '' } = req.query;
      
      const result = await BookModel.getBooksWithPagination(
        parseInt(page), 
        parseInt(limit), 
        search, 
        category,
        stock
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
      const { 
        title, 
        author, 
        publisher, 
        publish_year, 
        isbn,
        pages,
        stock, 
        location,
        description,
        category_id,
        cover_type,
        cover_url 
      } = req.body;

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
        publish_year: publish_year ? parseInt(publish_year) : new Date().getFullYear(),
        isbn: isbn ? parseInt(isbn) : null,
        pages: pages ? parseInt(pages) : null,
        stock: stock ? parseInt(stock) : 0,
        location: location || '',
        description: description || '',
        category_id: category_id || null
      };

      // Handle cover image
      if (cover_type === 'url' && cover_url) {
        bookData.image_url = cover_url;
      } else if (cover_type === 'file' && req.file) {
        bookData.image_url = `/uploads/${req.file.filename}`;
      }

      const result = await BookModel.createBook(bookData);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          book_id: result.book_id
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
      const { 
        title, 
        author, 
        publisher, 
        publish_year, 
        isbn,
        pages,
        stock, 
        location,
        description,
        category_id,
        cover_type,
        cover_url 
      } = req.body;

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
        publish_year: publish_year ? parseInt(publish_year) : new Date().getFullYear(),
        isbn: isbn ? parseInt(isbn) : null,
        pages: pages ? parseInt(pages) : null,
        stock: stock ? parseInt(stock) : 0,
        location: location || '',
        description: description || '',
        category_id: category_id || null
      };

      // Handle cover image
      if (cover_type === 'url' && cover_url) {
        bookData.image_url = cover_url;
      } else if (cover_type === 'file' && req.file) {
        bookData.image_url = `/uploads/${req.file.filename}`;
      }

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