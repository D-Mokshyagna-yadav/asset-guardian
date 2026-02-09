export type DeviceStatus = 'IN_STOCK' | 'ASSIGNED' | 'MAINTENANCE' | 'SCRAPPED';

export type AssignmentStatus = 'ACTIVE' | 'RETURNED' | 'MAINTENANCE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN';
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
  hodPhone: string;
  hodEmail: string;
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
  departmentId?: string | Department;
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
  features?: string[];
  notes?: string;
  createdBy?: string | { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  deviceId: string | Device;
  departmentId: string | Department;
  locationId?: string | Location;
  quantity: number;
  notes?: string;
  status: AssignmentStatus;
  assignedAt: string;
  returnedAt?: string;
  createdAt: string;
  updatedAt: string;
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
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
