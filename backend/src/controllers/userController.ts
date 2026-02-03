import { Response } from 'express';
import { body, param, query } from 'express-validator';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { catchAsync, AppError } from '../middleware/errorHandler';

export const userValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .isIn(['SUPER_ADMIN', 'IT_STAFF', 'DEPARTMENT_INCHARGE'])
    .withMessage('Invalid role'),
  body('departmentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid department ID'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const createUserValidation = [
  ...userValidation,
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
];

export const getUsers = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const role = req.query.role as string;
  const isActive = req.query.isActive as string;

  const query: any = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const skip = (page - 1) * limit;

  const users = await User.find(query)
    .populate('departmentId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getUserById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.params.id).populate('departmentId');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user },
  });
});

export const createUser = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userData = {
    ...req.body,
    createdBy: req.user!._id,
  };

  const user = await User.create(userData);
  const populatedUser = await User.findById(user._id).populate('departmentId');

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user: populatedUser },
  });
});

export const updateUser = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Prevent users from updating their own role or status
  if (req.user!._id.toString() === id) {
    delete req.body.role;
    delete req.body.isActive;
  }

  // Remove password from updates if present (use separate endpoint)
  delete req.body.password;

  const user = await User.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  ).populate('departmentId');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user },
  });
});

export const deleteUser = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Prevent users from deleting themselves
  if (req.user!._id.toString() === id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

export const toggleUserStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Prevent users from deactivating themselves
  if (req.user!._id.toString() === id) {
    throw new AppError('You cannot deactivate your own account', 400);
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.isActive = !user.isActive;
  await user.save();

  const populatedUser = await User.findById(id).populate('departmentId');

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { user: populatedUser },
  });
});