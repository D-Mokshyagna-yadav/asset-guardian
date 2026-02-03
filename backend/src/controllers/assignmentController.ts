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
    .notEmpty()
    .withMessage('Location ID is required')
    .isMongoId()
    .withMessage('Invalid location ID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('reason')
    .isIn(['INSTALLATION', 'MAINTENANCE', 'REPLACEMENT_MALFUNCTION', 'UPGRADE', 'NEW_REQUIREMENT', 'OTHER'])
    .withMessage('Invalid reason'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

export const approvalValidation = [
  body('approvedBy')
    .notEmpty()
    .isMongoId()
    .withMessage('Approver ID is required'),
];

export const rejectionValidation = [
  body('remarks')
    .notEmpty()
    .withMessage('Rejection remarks are required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Remarks must be between 5 and 500 characters'),
];

export const getAssignments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const departmentId = req.query.departmentId as string;
  const deviceId = req.query.deviceId as string;
  const requestedBy = req.query.requestedBy as string;

  const query: any = {};

  if (status) {
    query.status = status;
  }

  if (departmentId) {
    query.departmentId = departmentId;
  }

  if (deviceId) {
    query.deviceId = deviceId;
  }

  if (requestedBy) {
    query.requestedBy = requestedBy;
  }

  const skip = (page - 1) * limit;

  const assignments = await Assignment.find(query)
    .populate('deviceId')
    .populate('departmentId')
    .populate('locationId')
    .populate('requestedBy')
    .populate('approvedBy')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Assignment.countDocuments(query);

  res.json({
    success: true,
    data: {
      assignments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getAssignmentById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id)
    .populate('deviceId')
    .populate('departmentId')
    .populate('locationId')
    .populate('requestedBy')
    .populate('approvedBy');

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  res.json({
    success: true,
    data: assignment,
  });
});

export const createAssignment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { deviceId, departmentId, locationId, quantity, reason, notes } = req.body;

  // Check if device exists and has available quantity
  const device = await Device.findById(deviceId);
  if (!device) {
    throw new AppError('Device not found', 404);
  }

  // Calculate available quantity (considering existing assignments)
  const existingAssignments = await Assignment.find({
    deviceId,
    status: { $in: ['REQUESTED', 'APPROVED', 'PENDING'] },
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
    requestedBy: req.user?.id,
    quantity,
    reason,
    notes,
    status: 'REQUESTED',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await assignment.save();
  await assignment.populate(['deviceId', 'departmentId', 'locationId', 'requestedBy']);

  res.status(201).json({
    success: true,
    message: 'Assignment created successfully',
    data: assignment,
  });
});

export const updateAssignment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { deviceId, departmentId, locationId, quantity, reason, notes } = req.body;

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  // If updating device or quantity, check availability
  if (deviceId && deviceId !== assignment.deviceId.toString()) {
    const device = await Device.findById(deviceId);
    if (!device) {
      throw new AppError('Device not found', 404);
    }

    const existingAssignments = await Assignment.find({
      deviceId,
      _id: { $ne: id },
      status: { $in: ['REQUESTED', 'APPROVED', 'PENDING'] },
    });

    const assignedQty = existingAssignments.reduce((sum, a) => sum + a.quantity, 0);
    const availableQty = device.quantity - assignedQty;

    if ((quantity || assignment.quantity) > availableQty) {
      throw new AppError('Insufficient quantity available', 400);
    }

    assignment.deviceId = deviceId;
  }

  if (quantity && quantity > assignment.quantity) {
    // Verify availability if increasing quantity
    const device = await Device.findById(assignment.deviceId);
    if (!device) throw new AppError('Device not found', 404);

    const existingAssignments = await Assignment.find({
      deviceId: assignment.deviceId,
      _id: { $ne: id },
      status: { $in: ['REQUESTED', 'APPROVED', 'PENDING'] },
    });

    const assignedQty = existingAssignments.reduce((sum, a) => sum + a.quantity, 0);
    const availableQty = device.quantity - assignedQty;

    if (quantity > availableQty + assignment.quantity) {
      throw new AppError('Insufficient quantity available', 400);
    }

    assignment.quantity = quantity;
  }

  if (departmentId) assignment.departmentId = departmentId;
  if (locationId) assignment.locationId = locationId;
  if (reason) assignment.reason = reason;
  if (notes !== undefined) assignment.notes = notes;

  assignment.updatedAt = new Date();
  await assignment.save();
  await assignment.populate(['deviceId', 'departmentId', 'locationId', 'requestedBy']);

  res.json({
    success: true,
    message: 'Assignment updated successfully',
    data: assignment,
  });
});

export const approveAssignment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { approvedBy } = req.body;

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  if (assignment.status !== 'REQUESTED') {
    throw new AppError('Only REQUESTED assignments can be approved', 400);
  }

  assignment.status = 'APPROVED';
  assignment.approvedBy = approvedBy;
  assignment.assignedAt = new Date();
  assignment.updatedAt = new Date();

  await assignment.save();
  await assignment.populate(['deviceId', 'departmentId', 'locationId', 'requestedBy', 'approvedBy']);

  res.json({
    success: true,
    message: 'Assignment approved successfully',
    data: assignment,
  });
});

export const rejectAssignment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { remarks } = req.body;

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  if (assignment.status !== 'REQUESTED') {
    throw new AppError('Only REQUESTED assignments can be rejected', 400);
  }

  assignment.status = 'REJECTED';
  assignment.remarks = remarks;
  assignment.rejectedAt = new Date();
  assignment.updatedAt = new Date();

  await assignment.save();
  await assignment.populate(['deviceId', 'departmentId', 'locationId', 'requestedBy']);

  res.json({
    success: true,
    message: 'Assignment rejected successfully',
    data: assignment,
  });
});

export const completeAssignment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  if (assignment.status !== 'APPROVED' && assignment.status !== 'PENDING') {
    throw new AppError('Only APPROVED or PENDING assignments can be completed', 400);
  }

  assignment.status = 'COMPLETED';
  assignment.completedAt = new Date();
  assignment.updatedAt = new Date();

  await assignment.save();
  await assignment.populate(['deviceId', 'departmentId', 'locationId', 'requestedBy', 'approvedBy']);

  res.json({
    success: true,
    message: 'Assignment completed successfully',
    data: assignment,
  });
});

export const deleteAssignment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  // Only allow deletion of REQUESTED or REJECTED assignments
  if (!['REQUESTED', 'REJECTED'].includes(assignment.status)) {
    throw new AppError('Can only delete REQUESTED or REJECTED assignments', 400);
  }

  await Assignment.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Assignment deleted successfully',
  });
});

export const getAssignmentStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const total = await Assignment.countDocuments();
  const requested = await Assignment.countDocuments({ status: 'REQUESTED' });
  const approved = await Assignment.countDocuments({ status: 'APPROVED' });
  const rejected = await Assignment.countDocuments({ status: 'REJECTED' });
  const completed = await Assignment.countDocuments({ status: 'COMPLETED' });

  res.json({
    success: true,
    data: {
      total,
      requested,
      approved,
      rejected,
      completed,
    },
  });
});
