import mongoose, { Document, Schema } from 'mongoose';

export type AssignmentStatus = 'ACTIVE' | 'RETURNED' | 'MAINTENANCE';

export interface IAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  locationId?: mongoose.Types.ObjectId;
  quantity: number;
  notes?: string;
  status: AssignmentStatus;
  assignedAt: Date;
  returnedAt?: Date;
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
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  status: {
    type: String,
    enum: {
      values: ['ACTIVE', 'RETURNED', 'MAINTENANCE'],
      message: 'Invalid assignment status',
    },
    required: [true, 'Status is required'],
    default: 'ACTIVE',
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  returnedAt: {
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
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ createdAt: -1 });
assignmentSchema.index({ status: 1, createdAt: -1 });
assignmentSchema.index({ departmentId: 1, status: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);