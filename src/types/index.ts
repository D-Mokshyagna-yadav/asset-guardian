export type UserRole = 'SUPER_ADMIN' | 'IT_STAFF' | 'DEPARTMENT_INCHARGE';

export type DeviceStatus = 'IN_STOCK' | 'ISSUED' | 'INSTALLED' | 'MAINTENANCE' | 'SCRAPPED';

export type AssignmentStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PENDING' | 'COMPLETED' | 'MAINTENANCE';

export type RequestReason = 'INSTALLATION' | 'MAINTENANCE' | 'REPLACEMENT_MALFUNCTION' | 'UPGRADE' | 'NEW_REQUIREMENT' | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | Department;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  block: string;
  hodName: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  building: string;
  floor: string;
  room: string;
  rack?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  assetTag: string;
  deviceName: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  macAddress?: string;
  ipAddress?: string;
  purchaseDate: string;
  arrivalDate: string;
  vendor: string;
  invoiceNumber?: string;
  billDate?: string;
  billAmount?: number;
  billFilePath?: string;
  cost: number;
  quantity: number;
  warrantyStart?: string;
  warrantyEnd?: string;
  status: DeviceStatus;
  departmentId?: string | Department;
  locationId?: string | Location;
  inchargeUserId?: string | User;
  features?: string[];
  notes?: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  deviceId: string | Device;
  departmentId: string | Department;
  locationId: string | Location;
  requestedBy: string | User;
  quantity: number;
  reason: RequestReason;
  notes?: string;
  approvedBy?: string | User;
  status: AssignmentStatus;
  remarks?: string;
  assignedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string | User;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  timestamp: string;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
