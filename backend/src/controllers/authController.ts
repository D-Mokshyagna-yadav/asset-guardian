import { Response } from 'express';
import { body } from 'express-validator';
import { User } from '../models/User';
import { AuthenticatedRequest, generateTokens } from '../middleware/auth';
import { catchAsync, AppError } from '../middleware/errorHandler';

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const login = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  // Find user and explicitly include password
  const user = await User.findOne({ email }).select('+password').populate('departmentId');

  if (!user || !(await user.correctPassword(password, user.password))) {
    if (user) {
      await user.incLoginAttempts();
    }
    throw new AppError('Incorrect email or password', 401);
  }

  // Check if account is locked
  if (user.isLocked) {
    throw new AppError('Account is temporarily locked due to multiple failed login attempts', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact administrator.', 401);
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id.toString());

  // Remove password from output
  const userOutput = user.toJSON();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userOutput,
      accessToken,
      refreshToken,
    },
  });
});

export const logout = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // In a production app, you might want to maintain a blacklist of tokens
  // or use a more sophisticated token management system
  
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

export const getProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user!._id).populate('departmentId');
  
  res.json({
    success: true,
    data: { user },
  });
});

export const updateProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Users can only update certain fields
  const allowedFields = ['name'];
  const updates: any = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    updates,
    { new: true, runValidators: true }
  ).populate('departmentId');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

export const changePassword = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user!._id).select('+password');

  if (!user || !(await user.correctPassword(currentPassword, user.password))) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});