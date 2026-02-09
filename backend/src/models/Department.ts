import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  block: string;
  hodName: string;
  hodPhone: string;
  hodEmail: string;
  contactEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Department name must be at least 2 characters long'],
    maxlength: [100, 'Department name cannot exceed 100 characters'],
  },
  block: {
    type: String,
    required: [true, 'Block is required'],
    trim: true,
    maxlength: [50, 'Block cannot exceed 50 characters'],
  },
  hodName: {
    type: String,
    required: [true, 'HOD name is required'],
    trim: true,
    minlength: [2, 'HOD name must be at least 2 characters long'],
    maxlength: [100, 'HOD name cannot exceed 100 characters'],
  },
  hodPhone: {
    type: String,
    required: [true, 'HOD phone is required'],
    trim: true,
    maxlength: [20, 'HOD phone cannot exceed 20 characters'],
  },
  hodEmail: {
    type: String,
    required: [true, 'HOD email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter a valid HOD email address',
    ],
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter a valid contact email address',
    ],
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
departmentSchema.index({ name: 1 });
departmentSchema.index({ block: 1 });
departmentSchema.index({ contactEmail: 1 });

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);