import { Router } from 'express';
import {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  loginValidation,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { auditLogger } from '../middleware/audit';

const router = Router();

router.post('/login', loginValidation, handleValidationErrors, login);
router.post('/logout', authenticate, auditLogger('LOGOUT', 'User'), logout);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.patch('/change-password', authenticate, auditLogger('UPDATE', 'User'), changePassword);

export default router;