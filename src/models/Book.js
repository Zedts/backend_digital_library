import { connectDBDigitalLibrary } from '../config/dbConnection.js';
import fs from 'fs';
import path from 'path';

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
               b.isbn, b.pages, b.stock, b.location, b.description, b.category_id,
               c.category_name,
               bi.image_url,
               (SELECT COUNT(*) FROM Borrowings br WHERE br.book_id = b.book_id AND br.status = 'Borrowed') as borrowed_count,
               (SELECT AVG(CAST(rating AS FLOAT)) FROM Ratings WHERE book_id = b.book_id) as average_rating,
               (SELECT COUNT(*) FROM Ratings WHERE book_id = b.book_id) as total_ratings
        FROM Books b
        LEFT JOIN Categories c ON b.category_id = c.category_id
        LEFT JOIN BookImages bi ON b.book_id = bi.book_id AND bi.is_primary = 1
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
  static async getBooksWithPagination(page = 1, limit = 10, search = '', category = '', stock = '', rating = '') {
    try {
      const offset = (page - 1) * limit;
      let whereConditions = [];
      
      if (search) {
        const escapedSearch = search.replace(/'/g, "''");
        whereConditions.push(`(b.title LIKE '%${escapedSearch}%' OR b.author LIKE '%${escapedSearch}%' OR b.publisher LIKE '%${escapedSearch}%')`);
      }
      
      if (category) {
        whereConditions.push(`c.category_id = ${category}`);
      }

      if (stock === 'available') {
        whereConditions.push(`b.stock > 0`);
      } else if (stock === 'out-of-stock') {
        whereConditions.push(`b.stock = 0`);
      }

      // Rating filter
      if (rating) {
        whereConditions.push(`(
          (SELECT AVG(CAST(r.rating AS FLOAT)) FROM Ratings r WHERE r.book_id = b.book_id) <= ${rating} 
          OR (SELECT COUNT(*) FROM Ratings r WHERE r.book_id = b.book_id) = 0
        )`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT b.book_id, b.title, b.author, b.publisher, b.publish_year, 
               b.isbn, b.pages, b.stock, b.location, b.description,
               c.category_name, c.category_id,
               bi.image_url,
               (SELECT COUNT(*) FROM Borrowings br WHERE br.book_id = b.book_id AND br.status = 'Borrowed') as borrowed_count,
               (SELECT AVG(CAST(rating AS FLOAT)) FROM Ratings WHERE book_id = b.book_id) as average_rating,
               (SELECT COUNT(*) FROM Ratings WHERE book_id = b.book_id) as total_ratings
        FROM Books b
        LEFT JOIN Categories c ON b.category_id = c.category_id
        LEFT JOIN BookImages bi ON b.book_id = bi.book_id AND bi.is_primary = 1
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN (SELECT AVG(CAST(rating AS FLOAT)) FROM Ratings WHERE book_id = b.book_id) IS NULL THEN 0
            ELSE (SELECT AVG(CAST(rating AS FLOAT)) FROM Ratings WHERE book_id = b.book_id)
          END DESC,
          b.title ASC
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
      const { title, author, publisher, publish_year, isbn, pages, stock, location, description, category_id } = bookData;
      
      // Escape single quotes to prevent SQL injection
      const escapeString = (str) => {
        if (!str) return '';
        return str.replace(/'/g, "''");
      };
      
      const insertBookQuery = `
        INSERT INTO Books (title, author, publisher, publish_year, isbn, pages, stock, location, description, category_id)
        OUTPUT INSERTED.book_id
        VALUES ('${escapeString(title)}', '${escapeString(author || '')}', '${escapeString(publisher || '')}', ${publish_year || new Date().getFullYear()}, ${isbn || 'NULL'}, ${pages || 'NULL'}, ${stock || 0}, '${escapeString(location || '')}', '${escapeString(description || '')}', ${category_id || 'NULL'})
      `;
      const result = await connectDBDigitalLibrary(insertBookQuery);
      const bookId = result.recordset[0].book_id;
      
      // Handle image if provided
      if (bookData.image_url) {
        const imageQuery = `
          INSERT INTO BookImages (book_id, image_url, is_primary)
          VALUES (${bookId}, '${escapeString(bookData.image_url)}', 1)
        `;
        await connectDBDigitalLibrary(imageQuery);
      }
      
      return { success: true, message: 'Book created successfully', book_id: bookId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update book
  static async updateBook(bookId, bookData) {
    try {
      const { title, author, publisher, publish_year, isbn, pages, stock, location, description, category_id } = bookData;
      
      // Escape single quotes to prevent SQL injection
      const escapeString = (str) => {
        if (!str) return '';
        return str.replace(/'/g, "''");
      };
      
      const query = `
        UPDATE Books 
        SET title = '${escapeString(title)}', author = '${escapeString(author || '')}', publisher = '${escapeString(publisher || '')}', 
            publish_year = ${publish_year || new Date().getFullYear()}, 
            isbn = ${isbn || 'NULL'}, pages = ${pages || 'NULL'},
            stock = ${stock || 0}, location = '${escapeString(location || '')}', description = '${escapeString(description || '')}',
            category_id = ${category_id || 'NULL'}
        WHERE book_id = ${bookId}
      `;
      await connectDBDigitalLibrary(query);
      
      // Handle image update if provided
      if (bookData.image_url) {
        // Get old image before deleting record
        const getOldImageQuery = `SELECT image_url FROM BookImages WHERE book_id = ${bookId} AND is_primary = 1`;
        const oldImageResult = await connectDBDigitalLibrary(getOldImageQuery);
        
        // Delete old image file if exists
        if (oldImageResult.recordset && oldImageResult.recordset.length > 0) {
          const oldImageUrl = oldImageResult.recordset[0].image_url;
          if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
            const fileName = oldImageUrl.replace('/uploads/', '');
            const filePath = path.join('uploads', fileName);
            
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old file: ${filePath}`);
              }
            } catch (fileError) {
              console.error(`Error deleting old file ${filePath}:`, fileError.message);
            }
          }
        }

        // Delete old image record
        const deleteImageQuery = `DELETE FROM BookImages WHERE book_id = ${bookId} AND is_primary = 1`;
        await connectDBDigitalLibrary(deleteImageQuery);

        // Insert new image record
        const imageQuery = `
          INSERT INTO BookImages (book_id, image_url, is_primary)
          VALUES (${bookId}, '${escapeString(bookData.image_url)}', 1)
        `;
        await connectDBDigitalLibrary(imageQuery);
      }
      
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

      // Get image files before deleting records
      const getImagesQuery = `SELECT image_url FROM BookImages WHERE book_id = ${bookId}`;
      const imagesResult = await connectDBDigitalLibrary(getImagesQuery);
      
      // Delete image files from uploads folder
      if (imagesResult.recordset && imagesResult.recordset.length > 0) {
        for (const imageRecord of imagesResult.recordset) {
          const imageUrl = imageRecord.image_url;
          // Check if it's a local file (not external URL)
          if (imageUrl && imageUrl.startsWith('/uploads/')) {
            const fileName = imageUrl.replace('/uploads/', '');
            const filePath = path.join('uploads', fileName);
            
            try {
              // Check if file exists before trying to delete
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
              }
            } catch (fileError) {
              console.error(`Error deleting file ${filePath}:`, fileError.message);
            }
          }
        }
      }

      // Delete image records from database
      const deleteImagesQuery = `DELETE FROM BookImages WHERE book_id = ${bookId}`;
      await connectDBDigitalLibrary(deleteImagesQuery);

      // Delete book record
      const deleteBookQuery = `DELETE FROM Books WHERE book_id = ${bookId}`;
      await connectDBDigitalLibrary(deleteBookQuery);
      
      return { success: true, message: 'Book deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update book stock (for borrowing/returning)
  static async updateBookStock(bookId, stockChange) {
    try {
      const query = `
        UPDATE Books 
        SET stock = stock + ${stockChange}
        WHERE book_id = ${bookId}
      `;
      await connectDBDigitalLibrary(query);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get book rating summary
  static async getBookRating(bookId) {
    try {
      const query = `
        SELECT 
          AVG(CAST(rating AS FLOAT)) as average_rating,
          COUNT(*) as total_ratings
        FROM Ratings 
        WHERE book_id = ${bookId}
      `;
      const result = await connectDBDigitalLibrary(query);
      const rating = result.recordset[0];
      
      return { 
        success: true, 
        data: {
          average_rating: rating.average_rating ? parseFloat(rating.average_rating.toFixed(1)) : null,
          total_ratings: rating.total_ratings
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get book rating comments
  static async getBookRatingComments(bookId) {
    try {
      const query = `
        SELECT 
          r.rating, r.comment, r.rating_date,
          u.name as user_name
        FROM Ratings r
        INNER JOIN Users u ON r.users_id = u.users_id
        WHERE r.book_id = ${bookId} AND r.comment IS NOT NULL AND r.comment != ''
        ORDER BY r.rating_date DESC
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default BookModel;