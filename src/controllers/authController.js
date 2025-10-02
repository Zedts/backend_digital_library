import UserModel from '../models/User.js';
import RegisterModel from '../models/Register.js';

class AuthController {
  // Login controller
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const result = await UserModel.authenticateUser(email, password);
      
      if (result.success && result.data) {
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          data: {
            users_id: result.data.users_id,
            name: result.data.name,
            email: result.data.email,
            role: result.data.role
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Register controller
  static async register(req, res) {
    try {
      const { fullName, email, password } = req.body;

      // Validate input
      if (!fullName || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Full name, email, and password are required'
        });
      }

      // Check if email exists in Users table
      const userExists = await UserModel.emailExists(email);
      if (userExists.exists) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // Check if email exists in Register table
      const registerExists = await RegisterModel.emailExistsInRegister(email);
      if (registerExists.exists) {
        return res.status(400).json({
          success: false,
          error: 'Registration request already pending'
        });
      }

      const result = await RegisterModel.createRegisterRequest({
        name: fullName,
        email,
        hashedPassword: password
      });

      if (result.success) {
        return res.status(201).json({
          success: true,
          message: 'Registration request submitted successfully. Please wait for admin approval.'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export default AuthController;