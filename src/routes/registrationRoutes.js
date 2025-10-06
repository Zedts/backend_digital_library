import express from 'express';
import RegistrationController from '../controllers/registrationController.js';

const router = express.Router();

router.get('/', RegistrationController.getRegistrations);
router.get('/pending', RegistrationController.getPendingRequests);
router.get('/:id', RegistrationController.getRegistrationById);
router.put('/:id/approve', RegistrationController.approveRegistration);
router.put('/:id/reject', RegistrationController.rejectRegistration);
router.delete('/:id', RegistrationController.deleteRegistration);

export default router;
