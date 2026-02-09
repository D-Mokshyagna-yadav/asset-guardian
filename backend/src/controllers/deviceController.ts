import { Response } from 'express';
import { body } from 'express-validator';
import { Device } from '../models/Device';
import { Assignment } from '../models/Assignment';
import { AuthenticatedRequest } from '../middleware/auth';
import { catchAsync, AppError } from '../middleware/errorHandler';

export const deviceValidation = [
  body('assetTag')
    .trim()
    .notEmpty()
    .withMessage('Asset tag is required')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Asset tag must contain only uppercase letters, numbers, and hyphens'),
  body('deviceName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Device name must be between 2 and 200 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required'),
  body('deviceModel')
    .trim()
    .notEmpty()
    .withMessage('Model is required'),
  body('serialNumber')
    .trim()
    .notEmpty()
    .withMessage('Serial number is required'),
  body('cost')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('status')
    .optional()
    .isIn(['IN_STOCK', 'ASSIGNED', 'MAINTENANCE', 'SCRAPPED'])
    .withMessage('Invalid device status'),
];

export const deviceUpdateValidation = [
  body('assetTag')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Asset tag cannot be empty')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Asset tag must contain only uppercase letters, numbers, and hyphens'),
  body('deviceName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Device name must be between 2 and 200 characters'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('brand')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Brand cannot be empty'),
  body('deviceModel')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Model cannot be empty'),
  body('serialNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Serial number cannot be empty'),
  body('cost')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('status')
    .optional()
    .isIn(['IN_STOCK', 'ASSIGNED', 'MAINTENANCE', 'SCRAPPED'])
    .withMessage('Invalid device status'),
];

export const getDevices = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const status = req.query.status as string;
  const category = req.query.category as string;
  const departmentId = req.query.departmentId as string;

  const query: any = {};

  if (search) {
    query.$text = { $search: search };
  }

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = { $regex: category, $options: 'i' };
  }

  if (departmentId) {
    query.departmentId = departmentId;
  }

  const skip = (page - 1) * limit;

  const devices = await Device.find(query)
    .populate('departmentId')
    .populate('locationId')
    .populate('createdBy')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Device.countDocuments(query);

  res.json({
    success: true,
    data: {
      devices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getDeviceById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const device = await Device.findById(req.params.id)
    .populate('departmentId')
    .populate('locationId')
    .populate('createdBy');

  if (!device) {
    throw new AppError('Device not found', 404);
  }

  res.json({
    success: true,
    data: { device },
  });
});

export const createDevice = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const deviceData = {
    ...req.body,
    createdBy: req.user!._id,
  };

  // Convert date strings to Date objects
  if (deviceData.purchaseDate) {
    deviceData.purchaseDate = new Date(deviceData.purchaseDate);
  }
  if (deviceData.arrivalDate) {
    deviceData.arrivalDate = new Date(deviceData.arrivalDate);
  }
  if (deviceData.billDate) {
    deviceData.billDate = new Date(deviceData.billDate);
  }
  if (deviceData.warrantyStart) {
    deviceData.warrantyStart = new Date(deviceData.warrantyStart);
  }
  if (deviceData.warrantyEnd) {
    deviceData.warrantyEnd = new Date(deviceData.warrantyEnd);
  }

  const device = await Device.create(deviceData);
  const populatedDevice = await Device.findById(device._id)
    .populate('departmentId')
    .populate('locationId')
    .populate('createdBy');

  res.status(201).json({
    success: true,
    message: 'Device created successfully',
    data: { device: populatedDevice },
  });
});

export const updateDevice = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Convert date strings to Date objects
  if (req.body.purchaseDate) {
    req.body.purchaseDate = new Date(req.body.purchaseDate);
  }
  if (req.body.arrivalDate) {
    req.body.arrivalDate = new Date(req.body.arrivalDate);
  }
  if (req.body.billDate) {
    req.body.billDate = new Date(req.body.billDate);
  }
  if (req.body.warrantyStart) {
    req.body.warrantyStart = new Date(req.body.warrantyStart);
  }
  if (req.body.warrantyEnd) {
    req.body.warrantyEnd = new Date(req.body.warrantyEnd);
  }

  const device = await Device.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('departmentId')
    .populate('locationId')
    .populate('createdBy');

  if (!device) {
    throw new AppError('Device not found', 404);
  }

  res.json({
    success: true,
    message: 'Device updated successfully',
    data: { device },
  });
});

export const deleteDevice = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Check if device has pending assignments
  const pendingAssignments = await Assignment.findOne({
    deviceId: id,
    status: 'ACTIVE',
  });

  if (pendingAssignments) {
    throw new AppError('Cannot delete device with active assignments', 400);
  }

  const device = await Device.findByIdAndDelete(id);

  if (!device) {
    throw new AppError('Device not found', 404);
  }

  res.json({
    success: true,
    message: 'Device deleted successfully',
  });
});

export const getDeviceStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await Device.aggregate([
    {
      $group: {
        _id: null,
        totalDevices: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$cost', '$quantity'] } },
        inStock: {
          $sum: {
            $cond: [{ $eq: ['$status', 'IN_STOCK'] }, 1, 0]
          }
        },
        assigned: {
          $sum: {
            $cond: [{ $eq: ['$status', 'ASSIGNED'] }, 1, 0]
          }
        },
        maintenance: {
          $sum: {
            $cond: [{ $eq: ['$status', 'MAINTENANCE'] }, 1, 0]
          }
        },
        scrapped: {
          $sum: {
            $cond: [{ $eq: ['$status', 'SCRAPPED'] }, 1, 0]
          }
        },
      }
    }
  ]);

  const categoryStats = await Device.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$cost', '$quantity'] } },
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalDevices: 0,
        totalValue: 0,
        inStock: 0,
        assigned: 0,
        maintenance: 0,
        scrapped: 0,
      },
      categoryBreakdown: categoryStats,
    },
  });
});

export const getAvailableQuantity = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const device = await Device.findById(id);
  if (!device) {
    throw new AppError('Device not found', 404);
  }

  // Calculate assigned quantity from active assignments
  const assignedQuantity = await Assignment.aggregate([
    {
      $match: {
        deviceId: device._id,
        status: 'ACTIVE',
      }
    },
    {
      $group: {
        _id: null,
        totalAssigned: { $sum: '$quantity' },
      }
    }
  ]);

  const assigned = assignedQuantity.length > 0 ? assignedQuantity[0].totalAssigned : 0;
  const available = Math.max(0, device.quantity - assigned);

  res.json({
    success: true,
    data: {
      total: device.quantity,
      assigned,
      available,
    },
  });
});