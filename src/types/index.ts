export type UserRole = 'SUPER_ADMIN' | 'IT_STAFF' | 'DEPARTMENT_INCHARGE';

export type DeviceStatus = 'IN_STOCK' | 'ISSUED' | 'INSTALLED' | 'MAINTENANCE' | 'SCRAPPED';

export type AssignmentStatus = 'REQUESTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  block: string;
  hodName: string;
  contactEmail: string;
  createdAt: string;
}

export interface Location {
  id: string;
  building: string;
  floor: string;
  room: string;
  rack?: string;
  createdAt: string;
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
  vendor: string;
  invoiceNumber?: string;
  cost: number;
  warrantyStart?: string;
  warrantyEnd?: string;
  status: DeviceStatus;
  departmentId?: string;
  locationId?: string;
  inchargeUserId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  deviceId: string;
  departmentId: string;
  locationId: string;
  requestedBy: string;
  approvedBy?: string;
  status: AssignmentStatus;
  remarks?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  timestamp: string;
  ipAddress: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
