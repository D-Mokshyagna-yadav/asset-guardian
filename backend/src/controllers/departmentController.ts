import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Department } from '../models/Department';
import { AuthenticatedRequest } from '../middleware/auth';
import { catchAsync, AppError } from '../middleware/errorHandler';

export const departmentValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department name must be between 2 and 100 characters'),
  body('block')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Block name must be between 2 and 50 characters'),
  body('hodName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('HOD name must be between 2 and 100 characters'),
  body('hodPhone')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('HOD phone must be between 2 and 20 characters'),
  body('hodEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid HOD email'),
  body('contactEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid contact email'),
];

export const getDepartments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;

  const query: any = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { block: { $regex: search, $options: 'i' } },
      { hodName: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const departments = await Department.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Department.countDocuments(query);

  res.json({
    success: true,
    data: {
      departments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getDepartmentById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const department = await Department.findById(id);

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  res.json({
    success: true,
    data: { department },
  });
});

export const createDepartment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Invalid input data: ' + errors.array().map(e => e.msg).join(', '), 400);
  }

  const { name, block, hodName, hodPhone, hodEmail, contactEmail } = req.body;

  // Check if department name already exists
  const existingDepartment = await Department.findOne({ name });
  if (existingDepartment) {
    throw new AppError('Department name already exists', 409);
  }

  const department = await Department.create({
    name,
    block,
    hodName,
    hodPhone,
    hodEmail,
    contactEmail,
  });

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data: { department },
  });
});

export const updateDepartment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Invalid input data: ' + errors.array().map(e => e.msg).join(', '), 400);
  }

  const { id } = req.params;
  const { name, block, hodName, hodPhone, hodEmail, contactEmail } = req.body;

  // Check if department exists
  const department = await Department.findById(id);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  // Check if new name conflicts with existing department (if name is being changed)
  if (name && name !== department.name) {
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      throw new AppError('Department name already exists', 409);
    }
  }

  const updatedDepartment = await Department.findByIdAndUpdate(
    id,
    { name, block, hodName, hodPhone, hodEmail, contactEmail },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Department updated successfully',
    data: { department: updatedDepartment },
  });
});

export const deleteDepartment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const department = await Department.findById(id);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  // Check if department has users assigned to it
  const { User } = await import('../models/User');
  const usersCount = await User.countDocuments({ departmentId: id });
  if (usersCount > 0) {
    throw new AppError(`Cannot delete department. ${usersCount} users are assigned to this department.`, 409);
  }

  // Check if department has devices assigned to it
  const { Device } = await import('../models/Device');
  const devicesCount = await Device.countDocuments({ departmentId: id });
  if (devicesCount > 0) {
    throw new AppError(`Cannot delete department. ${devicesCount} devices are assigned to this department.`, 409);
  }

  await Department.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Department deleted successfully',
  });
});

export const getDepartmentStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { User, Device } = await import('../models');
  
  const departments = await Department.find().select('_id name');
  
  const stats = await Promise.all(
    departments.map(async (dept) => {
      const [usersCount, devicesCount] = await Promise.all([
        User.countDocuments({ departmentId: dept._id }),
        Device.countDocuments({ departmentId: dept._id }),
      ]);
      
      return {
        departmentId: dept._id,
        departmentName: dept.name,
        usersCount,
        devicesCount,
        totalAssets: usersCount + devicesCount,
      };
    })
  );

  const totalStats = {
    totalDepartments: departments.length,
    totalUsers: stats.reduce((sum, dept) => sum + dept.usersCount, 0),
    totalDevices: stats.reduce((sum, dept) => sum + dept.devicesCount, 0),
  };

  res.json({
    success: true,
    data: {
      departmentStats: stats,
      summary: totalStats,
    },
  });
});