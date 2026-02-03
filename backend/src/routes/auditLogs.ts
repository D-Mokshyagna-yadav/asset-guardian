import { Router } from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditLogsByEntity,
  getAuditLogStats,
  deleteAuditLog,
  deleteOldAuditLogs,
} from '../controllers/auditLogController';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();

// All audit log routes require authentication
router.use(authenticate);

// Get audit log statistics - SUPER_ADMIN only
router.get('/stats', authorize('SUPER_ADMIN'), getAuditLogStats);

// Get all audit logs - SUPER_ADMIN and IT_STAFF
router.get('/', authorize('SUPER_ADMIN', 'IT_STAFF'), getAuditLogs);

// Get audit logs for a specific entity - SUPER_ADMIN and IT_STAFF
router.get(
  '/:entityType/:entityId',
  authorize('SUPER_ADMIN', 'IT_STAFF'),
  getAuditLogsByEntity
);

// Get audit log by ID - SUPER_ADMIN and IT_STAFF
router.get('/:id', authorize('SUPER_ADMIN', 'IT_STAFF'), getAuditLogById);

// Delete audit log - SUPER_ADMIN only
router.delete(
  '/:id',
  authorize('SUPER_ADMIN'),
  auditLogger('DELETE', 'AuditLog'),
  deleteAuditLog
);

// Delete old audit logs - SUPER_ADMIN only
router.post(
  '/cleanup/old-logs',
  authorize('SUPER_ADMIN'),
  auditLogger('DELETE', 'AuditLog'),
  deleteOldAuditLogs
);

export default router;
