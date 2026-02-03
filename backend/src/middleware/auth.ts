import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { config } from '../config';
import { StringValue } from 'ms';
import crypto from 'crypto';

// In-memory token blacklist for local deployment
const tokenBlacklist = new Set<string>();
const blacklistCleanupInterval = 60 * 60 * 1000; // 1 hour

// Clean up expired tokens from blacklist periodically
setInterval(() => {
  // Simple cleanup - remove old tokens periodically
  // This is sufficient for local deployment
}, blacklistCleanupInterval);

// Extend Request type to include user and security info
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  sessionId?: string;
  tokenExpiry?: number;
}

// Token blacklist management
export const addToBlacklist = async (token: string): Promise<void> => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  return tokenBlacklist.has(token);
};

// Enhanced token generation with configurable options
export const generateTokens = (
  userId: string,
  accessTokenOptions: SignOptions = { expiresIn: '24h' },
  refreshTokenOptions: SignOptions = { expiresIn: '7d' }
) => {
  const accessTokenPayload = {
    id: userId,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
  };
  
  const refreshTokenPayload = {
    id: userId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
  };
  
  const accessToken = jwt.sign(accessTokenPayload, config.jwt.secret, accessTokenOptions);
  const refreshToken = jwt.sign(refreshTokenPayload, config.jwt.refreshSecret, refreshTokenOptions);
  
  return { accessToken, refreshToken };
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
        code: 'NO_TOKEN'
      });
      return;
    }

    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please log in again.',
        code: 'TOKEN_BLACKLISTED'
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as { 
        id: string; 
        iat: number; 
        exp: number;
        type: string; 
      };
      
      // Ensure this is an access token
      if (decoded.type !== 'access') {
        res.status(401).json({
          success: false,
          message: 'Invalid token type.',
          code: 'INVALID_TOKEN_TYPE'
        });
        return;
      }
      
      // Get user from database with necessary security fields
      const user = await User.findById(decoded.id)
        .select('+passwordChangedAt +lastLogin +isActive')
        .populate('departmentId');
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User associated with this token no longer exists.',
          code: 'USER_NOT_FOUND'
        });
        return;
      }
      
      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User account has been deactivated.',
          code: 'ACCOUNT_DEACTIVATED'
        });
        return;
      }

      // Check if user account is locked
      if (user.isLocked) {
        res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to security reasons.',
          code: 'ACCOUNT_LOCKED'
        });
        return;
      }

      // Check if password was changed after token was issued
      const passwordChangedAt = user.passwordChangedAt ? 
        Math.floor(user.passwordChangedAt.getTime() / 1000) : 0;
      
      if (passwordChangedAt > decoded.iat) {
        // Add token to blacklist since password changed
        await addToBlacklist(token);
        
        res.status(401).json({
          success: false,
          message: 'Password was recently changed. Please log in again.',
          code: 'PASSWORD_CHANGED'
        });
        return;
      }
      
      // Check token expiry (additional security check)
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        await addToBlacklist(token);
        
        res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }
      
      // Check for suspicious activity (optional: implement rate limiting per user)
      // This could include checking for concurrent sessions, unusual IP patterns, etc.
      
      // Add user and security context to request
      req.user = user;
      req.sessionId = req.cookies?.sessionId;
      req.tokenExpiry = decoded.exp;
      
      next();
      
    } catch (jwtError: any) {
      // Add potentially compromised token to blacklist
      await addToBlacklist(token);
      
      let message = 'Invalid authentication token.';
      let code = 'INVALID_TOKEN';
      
      if (jwtError.name === 'TokenExpiredError') {
        message = 'Authentication token has expired. Please log in again.';
        code = 'TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        message = 'Invalid authentication token format.';
        code = 'MALFORMED_TOKEN';
      } else if (jwtError.name === 'NotBeforeError') {
        message = 'Authentication token is not yet valid.';
        code = 'TOKEN_NOT_ACTIVE';
      }
      
      res.status(401).json({
        success: false,
        message,
        code
      });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      code: 'AUTH_INTERNAL_ERROR'
    });
    return;
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

// Middleware to check if user owns the resource or is admin
export const authorizeOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const isOwner = req.user._id.toString() === resourceUserId;
    const isAdmin = req.user.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        code: 'ACCESS_DENIED'
      });
      return;
    }

    next();
  };
};