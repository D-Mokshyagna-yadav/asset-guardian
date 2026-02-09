import { Router } from 'express';
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats,
  assignmentValidation,
} from '../controllers/assignmentController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { auditLogger } from '../middleware/audit';

const router = Router();

// All assignment routes require authentication
router.use(authenticate);

// Get assignment statistics
router.get('/stats', getAssignmentStats);

// CRUD operations - all done by admin
router.get('/', getAssignments);
router.get('/:id', getAssignmentById);

router.post(
  '/',
  assignmentValidation,
  handleValidationErrors,
  auditLogger('CREATE', 'Assignment'),
  createAssignment
);

router.patch(
  '/:id',
  handleValidationErrors,
  auditLogger('UPDATE', 'Assignment'),
  updateAssignment
);

router.delete(
  '/:id',
  auditLogger('DELETE', 'Assignment'),
  deleteAssignment
);

export default router;
