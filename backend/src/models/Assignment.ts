import mongoose, { Document, Schema } from 'mongoose';

export type AssignmentStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PENDING' | 'COMPLETED' | 'MAINTENANCE';
export type RequestReason = 'INSTALLATION' | 'MAINTENANCE' | 'REPLACEMENT_MALFUNCTION' | 'UPGRADE' | 'NEW_REQUIREMENT' | 'OTHER';

export interface IAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  quantity: number;
  reason: RequestReason;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  status: AssignmentStatus;
  remarks?: string;
  assignedAt?: Date;
  completedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device is required'],
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location is required'],
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requested by user is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number',
    },
  },
  reason: {
    type: String,
    enum: {
      values: ['INSTALLATION', 'MAINTENANCE', 'REPLACEMENT_MALFUNCTION', 'UPGRADE', 'NEW_REQUIREMENT', 'OTHER'],
      message: 'Invalid reason for assignment',
    },
    required: [true, 'Reason is required'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: {
      values: ['REQUESTED', 'APPROVED', 'REJECTED', 'PENDING', 'COMPLETED', 'MAINTENANCE'],
      message: 'Invalid assignment status',
    },
    required: [true, 'Status is required'],
    default: 'REQUESTED',
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
  },
  assignedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
assignmentSchema.index({ deviceId: 1 });
assignmentSchema.index({ departmentId: 1 });
assignmentSchema.index({ requestedBy: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ createdAt: -1 });
assignmentSchema.index({ reason: 1 });

// Compound indexes for common queries
assignmentSchema.index({ status: 1, createdAt: -1 });
assignmentSchema.index({ departmentId: 1, status: 1 });

// Pre-save middleware to set timestamp fields
assignmentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'APPROVED':
        if (!this.assignedAt) this.assignedAt = now;
        break;
      case 'REJECTED':
        if (!this.rejectedAt) this.rejectedAt = now;
        break;
      case 'COMPLETED':
        if (!this.completedAt) this.completedAt = now;
        break;
    }
  }
  next();
});

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);