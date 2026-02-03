import { Router } from 'express';
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  approveAssignment,
  rejectAssignment,
  completeAssignment,
  deleteAssignment,
  getAssignmentStats,
  assignmentValidation,
  approvalValidation,
  rejectionValidation,
} from '../controllers/assignmentController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { auditLogger } from '../middleware/audit';

const router = Router();

// All assignment routes require authentication
router.use(authenticate);

// Get assignment statistics - All authenticated users
router.get('/stats', getAssignmentStats);

// Get all assignments - All authenticated users
router.get('/', getAssignments);

// Get assignment by ID - All authenticated users
router.get('/:id', getAssignmentById);

// Create assignment - DEPARTMENT_INCHARGE and SUPER_ADMIN
router.post(
  '/',
  authorize('SUPER_ADMIN', 'IT_STAFF', 'DEPARTMENT_INCHARGE'),
  assignmentValidation,
  handleValidationErrors,
  auditLogger('CREATE', 'Assignment'),
  createAssignment
);

// Update assignment - Creator or SUPER_ADMIN (only if REQUESTED status)
router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'IT_STAFF', 'DEPARTMENT_INCHARGE'),
  assignmentValidation,
  handleValidationErrors,
  auditLogger('UPDATE', 'Assignment'),
  updateAssignment
);

// Approve assignment - SUPER_ADMIN only
router.post(
  '/:id/approve',
  authorize('SUPER_ADMIN'),
  approvalValidation,
  handleValidationErrors,
  auditLogger('APPROVE', 'Assignment'),
  approveAssignment
);

// Reject assignment - SUPER_ADMIN only
router.post(
  '/:id/reject',
  authorize('SUPER_ADMIN'),
  rejectionValidation,
  handleValidationErrors,
  auditLogger('REJECT', 'Assignment'),
  rejectAssignment
);

// Complete assignment - SUPER_ADMIN or IT_STAFF
router.post(
  '/:id/complete',
  authorize('SUPER_ADMIN', 'IT_STAFF'),
  auditLogger('COMPLETE', 'Assignment'),
  completeAssignment
);

// Delete assignment - SUPER_ADMIN only (only for REQUESTED or REJECTED)
router.delete(
  '/:id',
  authorize('SUPER_ADMIN'),
  auditLogger('DELETE', 'Assignment'),
  deleteAssignment
);

export default router;
