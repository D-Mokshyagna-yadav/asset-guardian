import { Response } from 'express';
import { body } from 'express-validator';
import { Assignment } from '../models/Assignment';
import { Device } from '../models/Device';
import { AuthenticatedRequest } from '../middleware/auth';
import { catchAsync, AppError } from '../middleware/errorHandler';

export const assignmentValidation = [
  body('deviceId')
    .notEmpty()
    .withMessage('Device ID is required')
    .isMongoId()
    .withMessage('Invalid device ID'),
  body('departmentId')
    .notEmpty()
    .withMessage('Department ID is required')
    .isMongoId()
    .withMessage('Invalid department ID'),
  body('locationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid location ID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'RETURNED', 'MAINTENANCE'])
    .withMessage('Invalid status'),
];

export const getAssignments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const departmentId = req.query.departmentId as string;
  const deviceId = req.query.deviceId as string;

  const query: any = {};

  if (status) query.status = status;
  if (departmentId) query.departmentId = departmentId;
  if (deviceId) query.deviceId = deviceId;

  const skip = (page - 1) * limit;

  const assignments = await Assignment.find(query)
    .populate('deviceId')
    .populate('departmentId')
    .populate('locationId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Assignment.countDocuments(query);

  res.json({
    success: true,
    data: assignments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getAssignmentById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id)
    .populate('deviceId')
    .populate('departmentId')
    .populate('locationId');

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  res.json({
    success: true,
    data: { assignment },
  });
});

export const createAssignment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { deviceId, departmentId, locationId, quantity, notes } = req.body;

  // Check if device exists
  const device = await Device.findById(deviceId);
  if (!device) {
    throw new AppError('Device not found', 404);
  }

  // Check available quantity
  const existingAssignments = await Assignment.find({
    deviceId,
    status: { $in: ['ACTIVE', 'MAINTENANCE'] },
  });

  const assignedQty = existingAssignments.reduce((sum, a) => sum + a.quantity, 0);
  const availableQty = device.quantity - assignedQty;

  if (quantity > availableQty) {
    throw new AppError(
      `Insufficient quantity. Available: ${availableQty}, Requested: ${quantity}`,
      400
    );
  }

  const assignment = new Assignment({
    deviceId,
    departmentId,
    locationId,
    quantity,
    notes,
    status: 'ACTIVE',
    assignedAt: new Date(),
  });

  await assignment.save();
  await assignment.populate(['deviceId', 'departmentId', 'locationId']);

  // Update device status
  await Device.findByIdAndUpdate(deviceId, {
    status: 'ASSIGNED',
    departmentId,
    locationId,
  });

  res.status(201).json({
    success: true,
    message: 'Device assigned to department successfully',
    data: { assignment },
  });
});

export const updateAssignment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { departmentId, locationId, quantity, notes, status } = req.body;

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  if (departmentId) assignment.departmentId = departmentId;
  if (locationId) assignment.locationId = locationId;
  if (notes !== undefined) assignment.notes = notes;
  if (status) {
    assignment.status = status;
    if (status === 'RETURNED') {
      assignment.returnedAt = new Date();
      // Update device back to IN_STOCK
      await Device.findByIdAndUpdate(assignment.deviceId, {
        status: 'IN_STOCK',
        $unset: { departmentId: 1 },
      });
    }
  }

  if (quantity) {
    const device = await Device.findById(assignment.deviceId);
    if (!device) throw new AppError('Device not found', 404);

    const existingAssignments = await Assignment.find({
      deviceId: assignment.deviceId,
      _id: { $ne: id },
      status: { $in: ['ACTIVE', 'MAINTENANCE'] },
    });

    const assignedQty = existingAssignments.reduce((sum, a) => sum + a.quantity, 0);
    const availableQty = device.quantity - assignedQty;

    if (quantity > availableQty) {
      throw new AppError('Insufficient quantity available', 400);
    }

    assignment.quantity = quantity;
  }

  await assignment.save();
  await assignment.populate(['deviceId', 'departmentId', 'locationId']);

  res.json({
    success: true,
    message: 'Assignment updated successfully',
    data: { assignment },
  });
});

export const deleteAssignment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  // If active, update device back to IN_STOCK
  if (assignment.status === 'ACTIVE') {
    await Device.findByIdAndUpdate(assignment.deviceId, {
      status: 'IN_STOCK',
      $unset: { departmentId: 1 },
    });
  }

  await Assignment.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Assignment deleted successfully',
  });
});

export const getAssignmentStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const total = await Assignment.countDocuments();
  const active = await Assignment.countDocuments({ status: 'ACTIVE' });
  const returned = await Assignment.countDocuments({ status: 'RETURNED' });
  const maintenance = await Assignment.countDocuments({ status: 'MAINTENANCE' });

  res.json({
    success: true,
    data: {
      total,
      active,
      returned,
      maintenance,
    },
  });
});
