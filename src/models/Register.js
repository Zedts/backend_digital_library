import { connectDBDigitalLibrary } from '../config/dbConnection.js';

class RegisterModel {
  static async createRegisterRequest(userData) {
    try {
      const { name, email, hashedPassword } = userData;
      const query = `
        INSERT INTO Register (name, email, password, requested_role, register_date, updated_date, status)
        VALUES ('${name}', '${email}', '${hashedPassword}', 'users', GETDATE(), GETDATE(), 'Pending')
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, message: 'Registration request created successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check if email already exists in Register table
  static async emailExistsInRegister(email) {
    try {
      const query = `SELECT COUNT(*) as count FROM Register WHERE email = '${email}'`;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, exists: result.recordset[0].count > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all pending registration requests
  static async getPendingRequests() {
    try {
      const query = `
        SELECT register_id, name, email, requested_role, register_date, status 
        FROM Register 
        WHERE status = 'Pending'
        ORDER BY register_date DESC
      `;
      const result = await connectDBDigitalLibrary(query);
      return { success: true, data: result.recordset };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default RegisterModel;