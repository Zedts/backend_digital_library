import { connectDBDigitalLibrary } from '../config/dbConnection.js';

class BorrowingModel {
  // Get borrowings with pagination and filters
  static async getBorrowingsWithPagination(page, limit, status, search) {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      if (status && status !== '') {
        if (status === 'overdue') {
          whereClause += ` AND br.status = 'Borrowed' AND br.due_date < GETDATE()`;
        } else {
          whereClause += ` AND br.status = '${status}'`;
        }
      }
      
      if (search && search !== '') {
        whereClause += ` AND (u.name LIKE '%${search}%' OR b.title LIKE '%${search}%' OR u.email LIKE '%${search}%')`;
      }

      const query = `
        SELECT br.borrowing_id, br.users_id, br.book_id, br.borrow_date, br.due_date, 
               br.return_date, br.status, br.notes, br.approved_by, br.approved_date,
               br.created_at, br.updated_at,
               u.name as user_name, u.email as user_email,
               b.title as book_title, b.author as book_author,
               approver.name as approved_by_name,
               CASE 
                 WHEN (br.status = 'Borrowed' OR br.status = 'Extended') AND br.due_date < GETDATE() THEN 'Overdue'
                 ELSE br.status 
               END as display_status,
               CASE 
                 WHEN (br.status = 'Borrowed' OR br.status = 'Extended') AND br.due_date < GETDATE() THEN DATEDIFF(day, br.due_date, GETDATE())
                 WHEN (br.status = 'Borrowed' OR br.status = 'Extended') THEN DATEDIFF(day, GETDATE(), br.due_date)
                 ELSE NULL 
               END as days_diff
        FROM Borrowings br
        JOIN Users u ON br.users_id = u.users_id
        JOIN Books b ON br.book_id = b.book_id
        LEFT JOIN Users approver ON br.approved_by = approver.users_id
        ${whereClause}
        ORDER BY br.created_at DESC
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM Borrowings br
        JOIN Users u ON br.users_id = u.users_id
        JOIN Books b ON br.book_id = b.book_id
        ${whereClause}
      `;

      const [result, countResult] = await Promise.all([
        connectDBDigitalLibrary(query),
        connectDBDigitalLibrary(countQuery)
      ]);

      const total = countResult.recordset[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: result.recordset,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get borrowing by ID
  static async getBorrowingById(id) {
    try {
      const query = `
        SELECT br.borrowing_id, br.users_id, br.book_id, br.borrow_date, br.due_date, 
               br.return_date, br.status, br.notes, br.approved_by, br.approved_date,
               br.created_at, br.updated_at,
               u.name as user_name, u.email as user_email,
               b.title as book_title, b.author as book_author, b.isbn, b.publisher,
               approver.name as approved_by_name,
               CASE 
                 WHEN (br.status = 'Borrowed' OR br.status = 'Extended') AND br.due_date < GETDATE() THEN 'Overdue'
                 ELSE br.status 
               END as display_status
        FROM Borrowings br
        JOIN Users u ON br.users_id = u.users_id
        JOIN Books b ON br.book_id = b.book_id
        LEFT JOIN Users approver ON br.approved_by = approver.users_id
        WHERE br.borrowing_id = ${id}
      `;
      
      const result = await connectDBDigitalLibrary(query);
      
      if (result.recordset.length > 0) {
        return { success: true, data: result.recordset[0] };
      } else {
        return { success: false, error: 'Borrowing not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create new borrowing
  static async createBorrowing(borrowingData) {
    try {
      const { users_id, book_id, borrow_date, due_date, notes, status = 'Pending' } = borrowingData;
      
      const query = `
        INSERT INTO Borrowings (users_id, book_id, borrow_date, due_date, notes, status, created_at, updated_at)
        OUTPUT INSERTED.borrowing_id
        VALUES (${users_id}, ${book_id}, '${borrow_date}', '${due_date}', ${notes ? `'${notes}'` : 'NULL'}, '${status}', GETDATE(), GETDATE())
      `;
      
      const result = await connectDBDigitalLibrary(query);
      const borrowingId = result.recordset[0].borrowing_id;
      
      return await this.getBorrowingById(borrowingId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update borrowing
  static async updateBorrowing(id, updateData) {
    try {
      const fields = [];
      
      if (updateData.status) fields.push(`status = '${updateData.status}'`);
      if (updateData.return_date) fields.push(`return_date = '${updateData.return_date}'`);
      if (updateData.approved_by) fields.push(`approved_by = ${updateData.approved_by}`);
      if (updateData.approved_date) fields.push(`approved_date = '${updateData.approved_date}'`);
      if (updateData.notes) fields.push(`notes = '${updateData.notes}'`);
      
      fields.push(`updated_at = GETDATE()`);
      
      const query = `
        UPDATE Borrowings 
        SET ${fields.join(', ')}
        WHERE borrowing_id = ${id}
      `;
      
      await connectDBDigitalLibrary(query);
      return await this.getBorrowingById(id);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update borrowing with due date (for extensions)
  static async updateBorrowingWithDueDate(id, updateData) {
    try {
      const fields = [];
      
      if (updateData.status) fields.push(`status = '${updateData.status}'`);
      if (updateData.due_date) fields.push(`due_date = '${updateData.due_date}'`);
      if (updateData.return_date) fields.push(`return_date = '${updateData.return_date}'`);
      if (updateData.approved_by) fields.push(`approved_by = ${updateData.approved_by}`);
      if (updateData.approved_date) fields.push(`approved_date = '${updateData.approved_date}'`);
      if (updateData.notes) fields.push(`notes = '${updateData.notes}'`);
      
      fields.push(`updated_at = GETDATE()`);
      
      const query = `
        UPDATE Borrowings 
        SET ${fields.join(', ')}
        WHERE borrowing_id = ${id}
      `;
      
      await connectDBDigitalLibrary(query);
      return await this.getBorrowingById(id);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete borrowing
  static async deleteBorrowing(id) {
    try {
      const query = `DELETE FROM Borrowings WHERE borrowing_id = ${id}`;
      await connectDBDigitalLibrary(query);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Add return record
  static async addReturnRecord(borrowingId, fine) {
    try {
      const query = `
        INSERT INTO Returns (borrowing_id, return_date, fine)
        VALUES (${borrowingId}, GETDATE(), ${fine})
      `;
      await connectDBDigitalLibrary(query);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get borrowing statistics
  static async getBorrowingStats() {
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'Borrowed' THEN 1 END) as borrowed_count,
          COUNT(CASE WHEN status = 'Returned' THEN 1 END) as returned_count,
          COUNT(CASE WHEN status = 'Borrowed' AND due_date < GETDATE() THEN 1 END) as overdue_count,
          COUNT(*) as total_count
        FROM Borrowings
      `;
      
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

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
        WHERE br.users_id = ${userId} AND (br.status = 'Borrowed' OR br.status = 'Extended')
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
        WHERE (br.status = 'Borrowed' OR br.status = 'Extended') AND br.due_date < GETDATE()
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
        WHERE (status = 'Borrowed' OR status = 'Extended') AND due_date < GETDATE()
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

  // Get activity trends for line chart (last 7 days)
  static async getActivityTrends() {
    try {
      const query = `
        SELECT 
          CAST(created_at as DATE) as date,
          COUNT(*) as requests,
          SUM(CASE WHEN status = 'Borrowed' OR return_date IS NOT NULL THEN 1 ELSE 0 END) as borrows,
          SUM(CASE WHEN return_date IS NOT NULL THEN 1 ELSE 0 END) as returns
        FROM Borrowings 
        WHERE created_at >= DATEADD(day, -6, CAST(GETDATE() as DATE))
        GROUP BY CAST(created_at as DATE)
        ORDER BY date
      `;
      const result = await connectDBDigitalLibrary(query);
      
      // Fill missing days with zero values
      const trends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = result.recordset.find(d => 
          new Date(d.date).toISOString().split('T')[0] === dateStr
        );
        
        trends.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          requests: dayData ? dayData.requests : 0,
          borrows: dayData ? dayData.borrows : 0,
          returns: dayData ? dayData.returns : 0
        });
      }
      
      return { success: true, data: trends };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get system overview chart data
  static async getSystemOverviewChart() {
    try {
      const query = `
        SELECT 
          'Overdue' as status,
          COUNT(*) as count
        FROM Borrowings 
        WHERE status IN ('Borrowed', 'Extended') AND due_date < GETDATE()
        UNION ALL
        SELECT 
          'Due Today' as status,
          COUNT(*) as count
        FROM Borrowings 
        WHERE status IN ('Borrowed', 'Extended') AND CAST(due_date as DATE) = CAST(GETDATE() as DATE)
        UNION ALL
        SELECT 
          'Active' as status,
          COUNT(*) as count
        FROM Borrowings 
        WHERE status IN ('Borrowed', 'Extended') AND due_date > GETDATE()
        UNION ALL
        SELECT 
          'Pending' as status,
          COUNT(*) as count
        FROM Borrowings 
        WHERE status = 'Pending'
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default BorrowingModel;