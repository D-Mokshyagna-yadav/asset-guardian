import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest, generateTokens, addToBlacklist, isTokenBlacklisted } from '../middleware/auth';
import { catchAsync, AppError } from '../middleware/errorHandler';
import { config } from '../config';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// Production-grade rate limiting for login attempts
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for login
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// More restrictive rate limiting for failed login attempts
export const failedLoginRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 failed attempts per hour
  message: {
    success: false,
    message: 'Too many failed login attempts from this IP, please try again after 1 hour.',
  },
  skipSuccessfulRequests: true,
});

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ min: 5, max: 254 })
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean value'),
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/) 
    .withMessage('New password must contain at least 8 characters with uppercase, lowercase, number and special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
];

// Helper function to get client IP with proxy support
const getClientIP = (req: AuthenticatedRequest): string => {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         req.headers['x-real-ip'] as string || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip || 
         'unknown';
};

// Helper function to get user agent
const getUserAgent = (req: AuthenticatedRequest): string => {
  return req.headers['user-agent'] || 'Unknown';
};

// Generate secure session ID
const generateSessionId = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const login = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Invalid input data: ' + errors.array().map(e => e.msg).join(', '), 400);
  }

  const { email, password, rememberMe = false } = req.body;
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);
  const sessionId = generateSessionId();

  // Find user and explicitly include password and security fields
  const user = await User.findOne({ email })
    .select('+password +loginAttempts +lockUntil +lastLogin +passwordChangedAt')
    .populate('departmentId');

  // Generic error message for security (don't reveal if user exists)
  const genericError = 'Invalid email or password';

  if (!user) {
    // Log failed login attempt for non-existent user
    await AuditLog.create({
      entityType: 'User',
      entityId: 'unknown',
      action: 'LOGIN',
      performedBy: null,
      oldData: { email, success: false, reason: 'User not found' },
      ipAddress: clientIP,
      userAgent,
      sessionId,
    });
    throw new AppError(genericError, 401);
  }

  // Check if account is locked before attempting password verification
  if (user.isLocked) {
    await AuditLog.create({
      entityType: 'User',
      entityId: user._id.toString(),
      action: 'LOGIN',
      performedBy: user._id,
      oldData: { email, success: false, reason: 'Account locked' },
      ipAddress: clientIP,
      userAgent,
      sessionId,
    });
    throw new AppError('Account is temporarily locked due to multiple failed login attempts. Please try again later or contact administrator.', 423);
  }

  // Check if user account is active
  if (!user.isActive) {
    await AuditLog.create({
      entityType: 'User',
      entityId: user._id.toString(),
      action: 'LOGIN',
      performedBy: user._id,
      oldData: { email, success: false, reason: 'Account deactivated' },
      ipAddress: clientIP,
      userAgent,
      sessionId,
    });
    throw new AppError('Your account has been deactivated. Please contact administrator.', 401);
  }

  // Verify password
  const isPasswordCorrect = await user.correctPassword(password, user.password);
  
  if (!isPasswordCorrect) {
    // Increment login attempts
    await user.incLoginAttempts();
    
    // Log failed login attempt
    await AuditLog.create({
      entityType: 'User',
      entityId: user._id.toString(),
      action: 'LOGIN',
      performedBy: user._id,
      oldData: { email, success: false, reason: 'Invalid password', loginAttempts: user.loginAttempts + 1 },
      ipAddress: clientIP,
      userAgent,
      sessionId,
    });
    
    throw new AppError(genericError, 401);
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Update last login and session info
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate tokens with different expiration for remember me
  const accessTokenOptions = { expiresIn: rememberMe ? '30d' : '24h' } as const;
  const refreshTokenOptions = { expiresIn: rememberMe ? '60d' : '7d' } as const;
  
  const { accessToken, refreshToken } = generateTokens(
    user._id.toString(),
    accessTokenOptions,
    refreshTokenOptions
  );
  
  const tokenExpiresIn = accessTokenOptions.expiresIn;

  // Log successful login
  await AuditLog.create({
    entityType: 'User',
    entityId: user._id.toString(),
    action: 'LOGIN',
    performedBy: user._id,
    newData: { 
      email, 
      success: true, 
      sessionId,
      rememberMe,
      tokenExpiry: tokenExpiresIn 
    },
    ipAddress: clientIP,
    userAgent,
    sessionId,
  });

  // Remove sensitive fields from user output
  const userOutput = user.toJSON() as any;
  delete userOutput.loginAttempts;
  delete userOutput.lockUntil;

  // Set secure HTTP-only cookies for refresh token
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: rememberMe ? 60 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 60 days or 7 days
  });

  // Set session cookie
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: rememberMe ? 60 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userOutput,
      accessToken,
      sessionId,
      expiresIn: tokenExpiresIn,
      rememberMe,
    },
  });
});

export const logout = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  // Get token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  const sessionId = req.cookies?.sessionId;
  
  if (token) {
    // Add token to blacklist
    await addToBlacklist(token);
  }
  
  if (req.user) {
    // Log logout activity
    await AuditLog.create({
      entityType: 'User',
      entityId: req.user._id.toString(),
      action: 'LOGOUT',
      performedBy: req.user._id,
      newData: { sessionId, logoutTime: new Date() },
      ipAddress: clientIP,
      userAgent,
      sessionId,
    });
  }
  
  // Clear cookies
  res.clearCookie('refreshToken');
  res.clearCookie('sessionId');
  
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

export const refreshToken = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken } = req.cookies;
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  if (!refreshToken) {
    throw new AppError('Refresh token not provided', 401);
  }
  
  // Check if refresh token is blacklisted
  if (await isTokenBlacklisted(refreshToken)) {
    throw new AppError('Invalid refresh token', 401);
  }
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { id: string; iat: number; exp: number };
    
    // Get user from database
    const user = await User.findById(decoded.id).populate('departmentId');
    
    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token or user account deactivated', 401);
    }
    
    // Check if user is locked
    if (user.isLocked) {
      throw new AppError('Account is temporarily locked', 401);
    }
    
    // Check if password was changed after token was issued
    const passwordChangedAt = user.passwordChangedAt ? Math.floor(user.passwordChangedAt.getTime() / 1000) : 0;
    if (passwordChangedAt > decoded.iat) {
      throw new AppError('Password was recently changed. Please log in again.', 401);
    }
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());
    
    // Blacklist old refresh token
    await addToBlacklist(refreshToken);
    
    // Log token refresh
    await AuditLog.create({
      entityType: 'User',
      entityId: user._id.toString(),
      action: 'TOKEN_REFRESH',
      performedBy: user._id,
      newData: { refreshTime: new Date() },
      ipAddress: clientIP,
      userAgent,
    });
    
    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Remove sensitive fields from user output
    const userOutput = user.toJSON();
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: userOutput,
        accessToken,
        expiresIn: '24h',
      },
    });
    
  } catch (jwtError) {
    // Blacklist potentially compromised refresh token
    await addToBlacklist(refreshToken);
    throw new AppError('Invalid refresh token', 401);
  }
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
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Invalid input data: ' + errors.array().map(e => e.msg).join(', '), 400);
  }
  
  const { currentPassword, newPassword } = req.body;
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  // Get user with password
  const user = await User.findById(req.user!._id).select('+password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Verify current password
  if (!(await user.correctPassword(currentPassword, user.password))) {
    // Log failed password change attempt
    await AuditLog.create({
      entityType: 'User',
      entityId: user._id.toString(),
      action: 'PASSWORD_CHANGE',
      performedBy: user._id,
      oldData: { success: false, reason: 'Invalid current password' },
      ipAddress: clientIP,
      userAgent,
    });
    
    throw new AppError('Current password is incorrect', 400);
  }
  
  // Check if new password is different from current
  if (await user.correctPassword(newPassword, user.password)) {
    throw new AppError('New password must be different from current password', 400);
  }
  
  // Update password
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();
  
  // Log successful password change
  await AuditLog.create({
    entityType: 'User',
    entityId: user._id.toString(),
    action: 'PASSWORD_CHANGE',
    performedBy: user._id,
    newData: { 
      success: true, 
      passwordChangedAt: user.passwordChangedAt,
      // Note: We don't log the actual password for security
    },
    ipAddress: clientIP,
    userAgent,
  });
  
  res.json({
    success: true,
    message: 'Password changed successfully. Please log in again with your new password.',
  });
});