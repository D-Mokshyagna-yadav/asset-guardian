import mongoose, { Document, Schema } from 'mongoose';

export type DeviceStatus = 'IN_STOCK' | 'ISSUED' | 'INSTALLED' | 'MAINTENANCE' | 'SCRAPPED';

export interface IDevice extends Document {
  _id: mongoose.Types.ObjectId;
  assetTag: string;
  deviceName: string;
  category: string;
  brand: string;
  deviceModel: string;
  serialNumber: string;
  macAddress?: string;
  ipAddress?: string;
  purchaseDate: Date;
  arrivalDate: Date;
  vendor: string;
  invoiceNumber?: string;
  billDate?: Date;
  billAmount?: number;
  billFilePath?: string;
  cost: number;
  quantity: number;
  warrantyStart?: Date;
  warrantyEnd?: Date;
  status: DeviceStatus;
  departmentId?: mongoose.Types.ObjectId;
  locationId?: mongoose.Types.ObjectId;
  inchargeUserId?: mongoose.Types.ObjectId;
  features?: string[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema<IDevice>({
  assetTag: {
    type: String,
    required: [true, 'Asset tag is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9-]+$/, 'Asset tag must contain only uppercase letters, numbers, and hyphens'],
  },
  deviceName: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
    minlength: [2, 'Device name must be at least 2 characters long'],
    maxlength: [200, 'Device name cannot exceed 200 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters'],
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [100, 'Brand cannot exceed 100 characters'],
  },
  deviceModel: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
    maxlength: [100, 'Model cannot exceed 100 characters'],
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [100, 'Serial number cannot exceed 100 characters'],
  },
  macAddress: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}$/, 'Please enter a valid MAC address (XX:XX:XX:XX:XX:XX)'],
  },
  ipAddress: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
      },
      message: 'Please enter a valid IP address',
    },
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required'],
  },
  arrivalDate: {
    type: Date,
    required: [true, 'Arrival date is required'],
    validate: {
      validator: function(this: IDevice, value: Date) {
        return value >= this.purchaseDate;
      },
      message: 'Arrival date must be on or after purchase date',
    },
  },
  vendor: {
    type: String,
    required: [true, 'Vendor is required'],
    trim: true,
    maxlength: [200, 'Vendor cannot exceed 200 characters'],
  },
  invoiceNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Invoice number cannot exceed 100 characters'],
  },
  billDate: {
    type: Date,
  },
  billAmount: {
    type: Number,
    min: [0, 'Bill amount cannot be negative'],
  },
  billFilePath: {
    type: String,
    trim: true,
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: [0, 'Cost cannot be negative'],
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
  warrantyStart: {
    type: Date,
  },
  warrantyEnd: {
    type: Date,
    validate: {
      validator: function(this: IDevice, value: Date) {
        return !this.warrantyStart || !value || value >= this.warrantyStart;
      },
      message: 'Warranty end date must be on or after warranty start date',
    },
  },
  status: {
    type: String,
    enum: {
      values: ['IN_STOCK', 'ISSUED', 'INSTALLED', 'MAINTENANCE', 'SCRAPPED'],
      message: 'Status must be IN_STOCK, ISSUED, INSTALLED, MAINTENANCE, or SCRAPPED',
    },
    required: [true, 'Status is required'],
    default: 'IN_STOCK',
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
  },
  inchargeUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  features: [{
    type: String,
    trim: true,
    maxlength: [200, 'Feature cannot exceed 200 characters'],
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required'],
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

// Indexes (assetTag and serialNumber indexes are created automatically by unique: true)
deviceSchema.index({ status: 1 });
deviceSchema.index({ category: 1 });
deviceSchema.index({ departmentId: 1 });
deviceSchema.index({ locationId: 1 });
deviceSchema.index({ createdBy: 1 });
deviceSchema.index({ createdAt: -1 });

// Text search index
deviceSchema.index({
  deviceName: 'text',
  brand: 'text',
  model: 'text',
  category: 'text',
  assetTag: 'text',
  serialNumber: 'text',
});

// Virtual for warranty status
deviceSchema.virtual('isUnderWarranty').get(function(this: IDevice) {
  if (!this.warrantyEnd) return false;
  return this.warrantyEnd > new Date();
});

// Virtual for total value
deviceSchema.virtual('totalValue').get(function(this: IDevice) {
  return this.cost * this.quantity;
});

export const Device = mongoose.model<IDevice>('Device', deviceSchema);