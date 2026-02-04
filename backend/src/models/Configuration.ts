import mongoose, { Document, Schema } from 'mongoose';

export interface UserRoleConfig {
  value: string;
  label: string;
  description?: string;
}

export interface StatusStyleConfig {
  status: string;
  classes: string;
  label?: string;
}

export interface RoleColorConfig {
  role: string;
  badgeColor: string;
  displayLabel: string;
}

export interface IConfiguration extends Document {
  key: string;
  userRoles?: UserRoleConfig[];
  statusStyles?: StatusStyleConfig[];
  roleColors?: RoleColorConfig[];
  data?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const configurationSchema = new Schema<IConfiguration>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userRoles: [
      {
        value: String,
        label: String,
        description: String,
      },
    ],
    statusStyles: [
      {
        status: String,
        classes: String,
        label: String,
      },
    ],
    roleColors: [
      {
        role: String,
        badgeColor: String,
        displayLabel: String,
      },
    ],
    data: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

export const Configuration = mongoose.model<IConfiguration>(
  'Configuration',
  configurationSchema
);
