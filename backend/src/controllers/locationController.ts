import { Response } from 'express';
import { body } from 'express-validator';
import { Location } from '../models/Location';
import { AuthenticatedRequest } from '../middleware/auth';
import { catchAsync, AppError } from '../middleware/errorHandler';

export const locationValidation = [
  body('building')
    .trim()
    .notEmpty()
    .withMessage('Building name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Building name must be between 2 and 100 characters'),
  body('floor')
    .trim()
    .notEmpty()
    .withMessage('Floor is required')
    .matches(/^[A-Z0-9\-\/]+$/i)
    .withMessage('Floor must contain only letters, numbers, hyphens and slashes'),
  body('room')
    .trim()
    .notEmpty()
    .withMessage('Room is required')
    .matches(/^[A-Z0-9\-\/]+$/i)
    .withMessage('Room must contain only letters, numbers, hyphens and slashes'),
  body('rack')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Rack must not exceed 50 characters'),
  body('departmentId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid department ID'),
];

export const getLocations = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const building = req.query.building as string;
  const departmentId = req.query.departmentId as string;

  const query: any = {};

  if (search) {
    query.$or = [
      { building: { $regex: search, $options: 'i' } },
      { floor: { $regex: search, $options: 'i' } },
      { room: { $regex: search, $options: 'i' } },
    ];
  }

  if (building) {
    query.building = { $regex: building, $options: 'i' };
  }

  if (departmentId) {
    query.departmentId = departmentId;
  }

  const skip = (page - 1) * limit;

  const locations = await Location.find(query)
    .populate('departmentId', 'name block')
    .sort({ building: 1, floor: 1, room: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Location.countDocuments(query);

  res.json({
    success: true,
    data: {
      locations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getLocationById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const location = await Location.findById(id);

  if (!location) {
    throw new AppError('Location not found', 404);
  }

  res.json({
    success: true,
    data: location,
  });
});

export const createLocation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { building, floor, room, rack, departmentId } = req.body;

  // Check for duplicate location
  const existing = await Location.findOne({ building, floor, room });
  if (existing) {
    throw new AppError('Location already exists', 400);
  }

  const location = new Location({
    building,
    floor,
    room,
    rack,
    departmentId: departmentId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await location.save();

  res.status(201).json({
    success: true,
    message: 'Location created successfully',
    data: location,
  });
});

export const updateLocation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { building, floor, room, rack, departmentId } = req.body;

  const location = await Location.findById(id);
  if (!location) {
    throw new AppError('Location not found', 404);
  }

  // Check for duplicate location (excluding current document)
  const existing = await Location.findOne({
    _id: { $ne: id },
    building,
    floor,
    room,
  });

  if (existing) {
    throw new AppError('Location already exists', 400);
  }

  if (building) location.building = building;
  if (floor) location.floor = floor;
  if (room) location.room = room;
  if (rack !== undefined) location.rack = rack;
  if (departmentId !== undefined) location.departmentId = departmentId || null;
  location.updatedAt = new Date();

  await location.save();

  res.json({
    success: true,
    message: 'Location updated successfully',
    data: location,
  });
});

export const deleteLocation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const location = await Location.findById(id);
  if (!location) {
    throw new AppError('Location not found', 404);
  }

  // Check if location is being used in any assignments or devices
  const { Device } = await import('../models/Device');
  const { Assignment } = await import('../models/Assignment');

  const deviceCount = await Device.countDocuments({ locationId: id });
  const assignmentCount = await Assignment.countDocuments({ locationId: id });

  if (deviceCount > 0 || assignmentCount > 0) {
    throw new AppError(
      'Cannot delete location. It is being used by devices or assignments',
      400
    );
  }

  await Location.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Location deleted successfully',
  });
});

export const getLocationsByBuilding = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { building } = req.params;

  const locations = await Location.find({ building }).sort({ floor: 1, room: 1 });

  res.json({
    success: true,
    data: locations,
  });
});

export const getBuildingList = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const buildings = await Location.distinct('building');

  res.json({
    success: true,
    data: buildings,
  });
});

export const getLocationsByDepartment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { departmentId } = req.params;

  const locations = await Location.find({ departmentId })
    .populate('departmentId', 'name block')
    .sort({ building: 1, floor: 1, room: 1 });

  res.json({
    success: true,
    data: {
      locations,
    },
  });
});
