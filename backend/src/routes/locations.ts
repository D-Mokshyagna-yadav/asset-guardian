import { Router } from 'express';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationsByBuilding,
  getBuildingList,
  locationValidation,
} from '../controllers/locationController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { auditLogger } from '../middleware/audit';

const router = Router();

// All location routes require authentication
router.use(authenticate);

// Get all buildings - All authenticated users
router.get('/buildings/list', getBuildingList);

// Get locations by building - All authenticated users
router.get('/building/:building', getLocationsByBuilding);

// Get all locations - All authenticated users
router.get('/', getLocations);

// Get location by ID - All authenticated users
router.get('/:id', getLocationById);

// Create location - ADMIN
router.post(
  '/',
  authorize('ADMIN'),
  locationValidation,
  handleValidationErrors,
  auditLogger('CREATE', 'Location'),
  createLocation
);

// Update location - ADMIN
router.patch(
  '/:id',
  authorize('ADMIN'),
  locationValidation,
  handleValidationErrors,
  auditLogger('UPDATE', 'Location'),
  updateLocation
);

// Delete location - ADMIN only
router.delete(
  '/:id',
  authorize('ADMIN'),
  auditLogger('DELETE', 'Location'),
  deleteLocation
);

export default router;
