import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from './auth';

export const auditLogger = (action: string, entityType: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const originalSend = res.json;
      let responseData: any;

      // Capture response data
      res.json = function(data: any) {
        responseData = data;
        return originalSend.call(this, data);
      };

      // Store original data for UPDATE operations
      let oldData: any;
      if (action === 'UPDATE' && req.params.id) {
        // This would need to be implemented per model
        // For now, we'll just log the request body as old data
        oldData = req.body.originalData;
      }

      next();

      // Log after the response is sent
      res.on('finish', async () => {
        if (req.user && res.statusCode < 400) {
          try {
            const entityId = req.params.id || responseData?.data?.id || responseData?.id || 'unknown';
            
            await AuditLog.create({
              entityType,
              entityId,
              action,
              performedBy: req.user._id,
              oldData,
              newData: action === 'DELETE' ? undefined : (responseData?.data || req.body),
              ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
              userAgent: req.get('user-agent'),
              sessionId: req.headers['x-session-id'] as string || 'unknown',
            });
          } catch (auditError) {
            console.error('Audit logging failed:', auditError);
            // Don't fail the request if audit logging fails
          }
        }
      });
    } catch (error) {
      console.error('Audit middleware error:', error);
      next();
    }
  };
};