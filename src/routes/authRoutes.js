import express from 'express';
import AuthController from '../controllers/authController.js';

const router = express.Router();

// Login route
router.post('/login', AuthController.login);

// Register route
router.post('/register', AuthController.register);

export default router;