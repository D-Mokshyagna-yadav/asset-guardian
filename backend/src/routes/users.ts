import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  userValidation,
  createUserValidation,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { auditLogger } from '../middleware/audit';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get all users - SUPER_ADMIN only
router.get('/', authorize('SUPER_ADMIN'), getUsers);

// Get user by ID - SUPER_ADMIN only
router.get('/:id', authorize('SUPER_ADMIN'), getUserById);

// Create user - SUPER_ADMIN only
router.post(
  '/',
  authorize('SUPER_ADMIN'),
  createUserValidation,
  handleValidationErrors,
  auditLogger('CREATE', 'User'),
  createUser
);

// Update user - SUPER_ADMIN only
router.patch(
  '/:id',
  authorize('SUPER_ADMIN'),
  userValidation,
  handleValidationErrors,
  auditLogger('UPDATE', 'User'),
  updateUser
);

// Delete user - SUPER_ADMIN only
router.delete(
  '/:id',
  authorize('SUPER_ADMIN'),
  auditLogger('DELETE', 'User'),
  deleteUser
);

// Toggle user status - SUPER_ADMIN only
router.patch(
  '/:id/status',
  authorize('SUPER_ADMIN'),
  auditLogger('STATUS_CHANGE', 'User'),
  toggleUserStatus
);

export default router;