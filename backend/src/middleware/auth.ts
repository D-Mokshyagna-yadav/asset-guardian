import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { config } from '../config';
import { StringValue } from 'ms';

// Extend Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

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
        message: 'Access denied. No token provided.',
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as { id: string; iat: number };
      
      // Get user from database
      const user = await User.findById(decoded.id).populate('departmentId');
      
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Invalid token or user account deactivated.',
        });
        return;
      }

      // Check if user is locked
      if (user.isLocked) {
        res.status(401).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts.',
        });
        return;
      }

      // Check if password was changed after token was issued
      const passwordChangedAt = user.passwordChangedAt ? Math.floor(user.passwordChangedAt.getTime() / 1000) : 0;
      if (passwordChangedAt > decoded.iat) {
        res.status(401).json({
          success: false,
          message: 'Password was recently changed. Please log in again.',
        });
        return;
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
      return;
    }

    next();
  };
};

// Generate JWT tokens
export const generateTokens = (userId: string) => {
  const payload = { id: userId };
  
  const accessTokenOptions: SignOptions = { 
    expiresIn: config.jwt.expiresIn as StringValue
  };
  
  const refreshTokenOptions: SignOptions = { 
    expiresIn: config.jwt.refreshExpiresIn as StringValue
  };
  
  const accessToken = jwt.sign(
    payload,
    config.jwt.secret as string,
    accessTokenOptions
  );

  const refreshToken = jwt.sign(
    payload,
    config.jwt.refreshSecret as string,
    refreshTokenOptions
  );

  return { accessToken, refreshToken };
};