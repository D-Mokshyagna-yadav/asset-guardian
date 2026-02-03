import { Router } from 'express';
import {
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  loginValidation,
  changePasswordValidation,
  loginRateLimit,
  failedLoginRateLimit,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { auditLogger } from '../middleware/audit';

const router = Router();

// Authentication endpoints with rate limiting
router.post('/login', 
  loginRateLimit,
  failedLoginRateLimit,
  loginValidation, 
  handleValidationErrors, 
  auditLogger('LOGIN', 'User'),
  login
);

router.post('/logout', 
  authenticate, 
  auditLogger('LOGOUT', 'User'), 
  logout
);

router.post('/refresh-token', 
  auditLogger('TOKEN_REFRESH', 'User'),
  refreshToken
);

// Profile management
router.get('/profile', 
  authenticate, 
  getProfile
);

router.patch('/profile', 
  authenticate, 
  auditLogger('UPDATE', 'User'), 
  updateProfile
);

router.patch('/change-password', 
  authenticate, 
  changePasswordValidation,
  handleValidationErrors,
  auditLogger('PASSWORD_CHANGE', 'User'), 
  changePassword
);

export default router;