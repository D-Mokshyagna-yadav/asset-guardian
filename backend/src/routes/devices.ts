import { Router } from 'express';
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceStats,
  getAvailableQuantity,
  deviceValidation,
} from '../controllers/deviceController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { auditLogger } from '../middleware/audit';

const router = Router();

// All device routes require authentication
router.use(authenticate);

// Get device statistics - All authenticated users
router.get('/stats', getDeviceStats);

// Get available quantity for a device - All authenticated users
router.get('/:id/availability', getAvailableQuantity);

// Get all devices - All authenticated users
router.get('/', getDevices);

// Get device by ID - All authenticated users
router.get('/:id', getDeviceById);

// Create device - SUPER_ADMIN and IT_STAFF
router.post(
  '/',
  authorize('SUPER_ADMIN', 'IT_STAFF'),
  deviceValidation,
  handleValidationErrors,
  auditLogger('CREATE', 'Device'),
  createDevice
);

// Update device - SUPER_ADMIN and IT_STAFF
router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'IT_STAFF'),
  deviceValidation,
  handleValidationErrors,
  auditLogger('UPDATE', 'Device'),
  updateDevice
);

// Delete device - SUPER_ADMIN only
router.delete(
  '/:id',
  authorize('SUPER_ADMIN'),
  auditLogger('DELETE', 'Device'),
  deleteDevice
);

export default router;