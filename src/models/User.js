import { connectDBDigitalLibrary } from '../config/dbConnection.js';

class UserModel {
  static async authenticateUser(email, hashedPassword) {
    try {
      const query = `
        SELECT users_id, name, email, role, created_date 
        FROM Users 
        WHERE email = '${email}' AND password = '${hashedPassword}'
      `;
      const result = await connectDBDigitalLibrary(query);
      if (result.recordset && result.recordset.length > 0) {
        return { success: true, data: result.recordset[0] };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check if email exists in Users table
  static async emailExists(email) {
    try {
      const query = `SELECT COUNT(*) as count FROM Users WHERE email = '${email}'`;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, exists: result.recordset[0].count > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get count of new users this week
  static async getNewUsersThisWeekCount() {
    try {
      const query = `
        SELECT COUNT(*) as total 
        FROM Users 
        WHERE created_date >= DATEADD(day, -7, GETDATE()) 
        AND role = 'users'
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset[0].total };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default UserModel;