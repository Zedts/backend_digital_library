import express from 'express';
import DashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Admin dashboard route
router.get('/admin', DashboardController.getAdminDashboard);

// User dashboard route
router.get('/user/:userId', DashboardController.getUserDashboard);

export default router;