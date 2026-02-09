import { Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import { catchAsync, AppError } from '../middleware/errorHandler';

export const getAuditLogs = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const entityType = req.query.entityType as string;
  const action = req.query.action as string;
  const performedBy = req.query.performedBy as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const query: any = {};

  if (entityType) {
    query.entityType = entityType;
  }

  if (action) {
    query.action = action;
  }

  if (performedBy) {
    query.performedBy = performedBy;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) {
      query.timestamp.$gte = new Date(startDate);
    }
    if (endDate) {
      query.timestamp.$lte = new Date(endDate);
    }
  }

  const skip = (page - 1) * limit;

  const auditLogs = await AuditLog.find(query)
    .populate('performedBy')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments(query);

  res.json({
    success: true,
    data: {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getAuditLogById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const auditLog = await AuditLog.findById(id).populate('performedBy');

  if (!auditLog) {
    throw new AppError('Audit log not found', 404);
  }

  res.json({
    success: true,
    data: auditLog,
  });
});

export const getAuditLogsByEntity = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityType, entityId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const query = { entityType, entityId };
  const skip = (page - 1) * limit;

  const auditLogs = await AuditLog.find(query)
    .populate('performedBy')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments(query);

  res.json({
    success: true,
    data: {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getAuditLogStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalLogs = await AuditLog.countDocuments();
  const todayLogs = await AuditLog.countDocuments({ timestamp: { $gte: today } });

  const actions = await AuditLog.aggregate([
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const entityTypes = await AuditLog.aggregate([
    {
      $group: {
        _id: '$entityType',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      totalLogs,
      todayLogs,
      actionBreakdown: actions,
      entityTypeBreakdown: entityTypes,
    },
  });
});

export const deleteAuditLog = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const auditLog = await AuditLog.findById(id);
  if (!auditLog) {
    throw new AppError('Audit log not found', 404);
  }

  // Only ADMIN can delete audit logs
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Only administrators can delete audit logs', 403);
  }

  await AuditLog.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Audit log deleted successfully',
  });
});

export const deleteOldAuditLogs = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Only ADMIN can delete audit logs
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Only administrators can delete audit logs', 403);
  }

  const { days = 90 } = req.body;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await AuditLog.deleteMany({ timestamp: { $lt: cutoffDate } });

  res.json({
    success: true,
    message: `Deleted ${result.deletedCount} audit logs older than ${days} days`,
    deletedCount: result.deletedCount,
  });
});
