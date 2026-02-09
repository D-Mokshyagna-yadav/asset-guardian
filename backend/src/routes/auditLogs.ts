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

// Get audit log statistics - ADMIN only
router.get('/stats', authorize('ADMIN'), getAuditLogStats);

// Get all audit logs - ADMIN
router.get('/', authorize('ADMIN'), getAuditLogs);

// Get audit logs for a specific entity - ADMIN
router.get(
  '/:entityType/:entityId',
  authorize('ADMIN'),
  getAuditLogsByEntity
);

// Get audit log by ID - ADMIN
router.get('/:id', authorize('ADMIN'), getAuditLogById);

// Delete audit log - ADMIN only
router.delete(
  '/:id',
  authorize('ADMIN'),
  auditLogger('DELETE', 'AuditLog'),
  deleteAuditLog
);

// Delete old audit logs - ADMIN only
router.post(
  '/cleanup/old-logs',
  authorize('ADMIN'),
  auditLogger('DELETE', 'AuditLog'),
  deleteOldAuditLogs
);

export default router;
