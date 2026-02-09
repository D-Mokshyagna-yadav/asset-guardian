import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: mongoose.Types.ObjectId;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: {
      values: ['Device', 'User', 'Assignment', 'Department', 'Location'],
      message: 'Invalid entity type',
    },
  },
  entityId: {
    type: String,
    required: [true, 'Entity ID is required'],
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: {
      values: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT'],
      message: 'Invalid action type',
    },
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Performed by user is required'],
  },
  oldData: {
    type: Schema.Types.Mixed,
  },
  newData: {
    type: Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    validate: {
      validator: function(v: string) {
        // IPv4 or IPv6 validation
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(v) || ipv6Regex.test(v) || v === '::1' || v === 'localhost';
      },
      message: 'Please enter a valid IP address',
    },
  },
  userAgent: {
    type: String,
    maxlength: [1000, 'User agent cannot exceed 1000 characters'],
  },
  sessionId: {
    type: String,
    maxlength: [200, 'Session ID cannot exceed 200 characters'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: [true, 'Timestamp is required'],
  },
}, {
  // Don't add timestamps as we use custom timestamp field
  timestamps: false,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for efficient querying
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1, timestamp: -1 });

// TTL index to automatically delete old audit logs after 2 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years in seconds

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);