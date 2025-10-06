import RegisterModel from '../models/Register.js';

class RegistrationController {
  // Get all registration requests with pagination and filters
  static async getRegistrations(req, res) {
    try {
      const { page = 1, limit = 10, status = '', search = '' } = req.query;
      
      const result = await RegisterModel.getRegistrations(page, limit, status, search);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          pagination: result.pagination,
          message: 'Registration requests retrieved successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get registration by ID
  static async getRegistrationById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid registration ID'
        });
      }

      const result = await RegisterModel.getRegistrationById(id);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Registration request retrieved successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Approve registration request
  static async approveRegistration(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid registration ID'
        });
      }

      const result = await RegisterModel.approveRegistration(id);
      
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
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Reject registration request
  static async rejectRegistration(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid registration ID'
        });
      }

      const result = await RegisterModel.rejectRegistration(id);
      
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
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get pending registration requests
  static async getPendingRequests(req, res) {
    try {
      const result = await RegisterModel.getPendingRequests();
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Pending registration requests retrieved successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Delete registration request
  static async deleteRegistration(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid registration ID'
        });
      }

      const result = await RegisterModel.deleteRegistration(id);
      
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
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export default RegistrationController;
