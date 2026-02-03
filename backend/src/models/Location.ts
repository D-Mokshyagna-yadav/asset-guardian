import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  _id: mongoose.Types.ObjectId;
  building: string;
  floor: string;
  room: string;
  rack?: string;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>({
  building: {
    type: String,
    required: [true, 'Building is required'],
    trim: true,
    maxlength: [100, 'Building cannot exceed 100 characters'],
  },
  floor: {
    type: String,
    required: [true, 'Floor is required'],
    trim: true,
    maxlength: [50, 'Floor cannot exceed 50 characters'],
  },
  room: {
    type: String,
    required: [true, 'Room is required'],
    trim: true,
    maxlength: [50, 'Room cannot exceed 50 characters'],
  },
  rack: {
    type: String,
    trim: true,
    maxlength: [50, 'Rack cannot exceed 50 characters'],
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
locationSchema.index({ building: 1, floor: 1, room: 1 });
locationSchema.index({ building: 1 });

// Compound unique index to prevent duplicate locations
locationSchema.index(
  { building: 1, floor: 1, room: 1, rack: 1 },
  { 
    unique: true,
    partialFilterExpression: { rack: { $type: 'string' } }
  }
);

locationSchema.index(
  { building: 1, floor: 1, room: 1 },
  { 
    unique: true,
    partialFilterExpression: { rack: { $exists: false } }
  }
);

export const Location = mongoose.model<ILocation>('Location', locationSchema);