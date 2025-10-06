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

  // Get all registration requests with pagination and filters
  static async getRegistrations(page = 1, limit = 10, status = '', search = '') {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const conditions = [];
      
      if (status && status.toLowerCase() !== '') {
        conditions.push(`status = '${status}'`);
      }
      
      if (search && search.trim() !== '') {
        conditions.push(`(name LIKE '%${search}%' OR email LIKE '%${search}%')`);
      }
      
      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM Register ${whereClause}`;
      const countResult = await connectDBDigitalLibrary(countQuery);
      const totalItems = countResult.recordset[0].total;

      // Get data with pagination
      const dataQuery = `
        SELECT register_id, name, email, requested_role, register_date, updated_date, status 
        FROM Register 
        ${whereClause}
        ORDER BY register_date DESC
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
      `;
      
      const result = await connectDBDigitalLibrary(dataQuery);
      
      return { 
        success: true, 
        data: result.recordset,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
          totalItems: totalItems,
          totalPages: Math.ceil(totalItems / limit)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get registration by ID
  static async getRegistrationById(registrationId) {
    try {
      const query = `
        SELECT register_id, name, email, requested_role, register_date, updated_date, status 
        FROM Register 
        WHERE register_id = ${registrationId}
      `;
      const result = await connectDBDigitalLibrary(query);
      
      if (result.recordset.length === 0) {
        return { success: false, error: 'Registration request not found' };
      }
      
      return { success: true, data: result.recordset[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Approve registration request and create user account
  static async approveRegistration(registrationId) {
    try {
      // Get registration data
      const getRegQuery = `
        SELECT name, email, password, requested_role 
        FROM Register 
        WHERE register_id = ${registrationId} AND status = 'Pending'
      `;
      const regResult = await connectDBDigitalLibrary(getRegQuery);
      
      if (regResult.recordset.length === 0) {
        return { success: false, error: 'Registration request not found or already processed' };
      }
      
      const regData = regResult.recordset[0];
      
      // Create user account
      const createUserQuery = `
        INSERT INTO Users (name, email, password, role, created_date, updated_date)
        VALUES ('${regData.name}', '${regData.email}', '${regData.password}', '${regData.requested_role}', GETDATE(), GETDATE())
      `;
      await connectDBDigitalLibrary(createUserQuery);
      
      // Update registration status to approved
      const updateRegQuery = `
        UPDATE Register 
        SET status = 'Approved', updated_date = GETDATE() 
        WHERE register_id = ${registrationId}
      `;
      await connectDBDigitalLibrary(updateRegQuery);
      
      return { success: true, message: 'Registration approved and user account created successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Reject registration request
  static async rejectRegistration(registrationId) {
    try {
      // Check if registration exists and is pending
      const checkQuery = `
        SELECT register_id 
        FROM Register 
        WHERE register_id = ${registrationId} AND status = 'Pending'
      `;
      const checkResult = await connectDBDigitalLibrary(checkQuery);
      
      if (checkResult.recordset.length === 0) {
        return { success: false, error: 'Registration request not found or already processed' };
      }
      
      // Update status to rejected
      const updateQuery = `
        UPDATE Register 
        SET status = 'Rejected', updated_date = GETDATE() 
        WHERE register_id = ${registrationId}
      `;
      await connectDBDigitalLibrary(updateQuery);
      
      return { success: true, message: 'Registration request rejected successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete registration request permanently
  static async deleteRegistration(registrationId) {
    try {
      // Check if registration exists
      const checkQuery = `
        SELECT register_id 
        FROM Register 
        WHERE register_id = ${registrationId}
      `;
      const checkResult = await connectDBDigitalLibrary(checkQuery);
      
      if (checkResult.recordset.length === 0) {
        return { success: false, error: 'Registration request not found' };
      }
      
      // Delete the registration record
      const deleteQuery = `
        DELETE FROM Register 
        WHERE register_id = ${registrationId}
      `;
      await connectDBDigitalLibrary(deleteQuery);
      
      return { success: true, message: 'Registration request deleted successfully' };
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