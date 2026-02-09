import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
  departmentValidation,
} from '../controllers/departmentController';
import { param } from 'express-validator';

const router = express.Router();

const objectIdValidation = param('id')
  .isMongoId()
  .withMessage('Invalid department ID format');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET routes
router.get('/', getDepartments);
router.get('/stats', authorize('ADMIN'), getDepartmentStats);
router.get('/:id', objectIdValidation, getDepartmentById);

// POST routes (admin only)
router.post(
  '/',
  authorize('ADMIN'),
  departmentValidation,
  createDepartment
);

// PUT routes (admin only)
router.put(
  '/:id',
  authorize('ADMIN'),
  objectIdValidation,
  departmentValidation,
  updateDepartment
);

// DELETE routes (admin only)
router.delete(
  '/:id',
  authorize('ADMIN'),
  objectIdValidation,
  deleteDepartment
);

export default router;