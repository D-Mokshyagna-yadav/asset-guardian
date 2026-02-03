import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'IT_STAFF' | 'DEPARTMENT_INCHARGE';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
  correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
  incLoginAttempts(): Promise<IUser>;
  resetLoginAttempts(): Promise<IUser>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false, // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['SUPER_ADMIN', 'IT_STAFF', 'DEPARTMENT_INCHARGE'],
      message: 'Role must be SUPER_ADMIN, IT_STAFF, or DEPARTMENT_INCHARGE',
    },
    required: [true, 'Role is required'],
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    validate: {
      validator: function(this: IUser, value: mongoose.Types.ObjectId) {
        // SUPER_ADMIN doesn't need a department
        return this.role === 'SUPER_ADMIN' || value != null;
      },
      message: 'IT_STAFF and DEPARTMENT_INCHARGE must belong to a department',
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
});

// Indexes (email index is created automatically by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ departmentId: 1 });
userSchema.index({ isActive: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function(this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const bcrypt = await import('bcryptjs');
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
userSchema.methods.correctPassword = async function(
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Method to handle login attempts
userSchema.methods.incLoginAttempts = function(): Promise<IUser> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function(): Promise<IUser> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

export const User = mongoose.model<IUser>('User', userSchema);