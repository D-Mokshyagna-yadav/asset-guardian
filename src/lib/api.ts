import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { User, Device, Department, Location, Assignment, AuditLog } from '../types';

// Dynamically resolve API URL based on the current browser hostname
// so it works on both localhost and LAN/network access
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:5173/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// For endpoints that return { success, data: T[], pagination } (e.g., assignments)
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}

// For endpoints that nest data inside a named key: { success, data: { [key]: T[], pagination } }
export interface NestedPaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[] | PaginationInfo;
    pagination: PaginationInfo;
  };
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    return api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', {
      email,
      password,
    });
  },
  
  logout: () => api.post<ApiResponse>('/auth/logout'),
  
  getProfile: () => {
    return api.get<ApiResponse<{ user: User }>>('/auth/profile');
  },
  
  changePassword: (currentPassword: string, newPassword: string, confirmPassword?: string) =>
    api.patch<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword: confirmPassword || newPassword,
    }),

  updateProfile: (data: { name?: string; email?: string }) =>
    api.patch<ApiResponse<{ user: User }>>('/auth/profile', data),
};

// Devices API
export const devicesApi = {
  getDevices: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    departmentId?: string;
  }) => api.get<ApiResponse<{ devices: Device[]; pagination: PaginationInfo }>>('/devices', { params }),
  
  getDeviceById: (id: string) => api.get<ApiResponse<{ device: Device }>>(`/devices/${id}`),
  
  createDevice: (data: Partial<Device>) => api.post<ApiResponse<{ device: Device }>>('/devices', data),
  
  updateDevice: (id: string, data: Partial<Device>) =>
    api.patch<ApiResponse<{ device: Device }>>(`/devices/${id}`, data),
  
  deleteDevice: (id: string) => api.delete<ApiResponse>(`/devices/${id}`),
  
  getDeviceStats: () => api.get<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byDepartment: Record<string, number>;
  }>>('/devices/stats'),

  getAvailableQuantity: (id: string) => api.get<ApiResponse<{
    total: number;
    assigned: number;
    available: number;
  }>>(`/devices/${id}/availability`),
};

// Departments API
export const departmentsApi = {
  getDepartments: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get<ApiResponse<{ departments: Department[]; pagination: PaginationInfo }>>('/departments', { params }),
  
  getDepartmentById: (id: string) => api.get<ApiResponse<{ department: Department }>>(`/departments/${id}`),
  
  createDepartment: (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<{ department: Department }>>('/departments', data),
  
  updateDepartment: (id: string, data: Partial<Department>) =>
    api.patch<ApiResponse<{ department: Department }>>(`/departments/${id}`, data),
  
  deleteDepartment: (id: string) => api.delete<ApiResponse>(`/departments/${id}`),

  getDepartmentStats: () => api.get<ApiResponse<{
    departmentStats: Array<{ department: Department; userCount: number; deviceCount: number }>;
    summary: { totalDepartments: number; totalUsers: number; totalDevices: number };
  }>>('/departments/stats'),
};

// Locations API
export const locationsApi = {
  getLocations: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    building?: string;
    departmentId?: string;
  }) => api.get<ApiResponse<{ locations: Location[]; pagination: PaginationInfo }>>('/locations', { params }),
  
  getLocationById: (id: string) => api.get<ApiResponse<Location>>(`/locations/${id}`),
  
  getLocationsByDepartment: (departmentId: string) => 
    api.get<ApiResponse<{ locations: Location[] }>>(`/locations/department/${departmentId}`),
  
  createLocation: (data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<{ location: Location }>>('/locations', data),
  
  updateLocation: (id: string, data: Partial<Location>) =>
    api.patch<ApiResponse<{ location: Location }>>(`/locations/${id}`, data),
  
  deleteLocation: (id: string) => api.delete<ApiResponse>(`/locations/${id}`),

  getBuildingList: () => api.get<ApiResponse<string[]>>('/locations/buildings/list'),

  getLocationsByBuilding: (building: string) =>
    api.get<ApiResponse<Location[]>>(`/locations/building/${encodeURIComponent(building)}`),
};

// Assignments API
export const assignmentsApi = {
  getAssignments: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    deviceId?: string;
    departmentId?: string;
  }) => api.get<PaginatedResponse<Assignment>>('/assignments', { params }),
  
  getAssignmentById: (id: string) => api.get<ApiResponse<{ assignment: Assignment }>>(`/assignments/${id}`),
  
  createAssignment: (data: Partial<Assignment>) => 
    api.post<ApiResponse<{ assignment: Assignment }>>('/assignments', data),
  
  updateAssignment: (id: string, data: Partial<Assignment>) =>
    api.patch<ApiResponse<{ assignment: Assignment }>>(`/assignments/${id}`, data),
  
  unassignDevice: (id: string) =>
    api.patch<ApiResponse<{ assignment: Assignment }>>(`/assignments/${id}`, { status: 'RETURNED' }),
  
  deleteAssignment: (id: string) => api.delete<ApiResponse>(`/assignments/${id}`),

  getAssignmentStats: () => api.get<ApiResponse<{
    total: number;
    active: number;
    returned: number;
    maintenance: number;
  }>>('/assignments/stats'),
};

// Audit Logs API
export const auditLogsApi = {
  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
    performedBy?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<ApiResponse<{ auditLogs: AuditLog[]; pagination: PaginationInfo }>>('/audit-logs', { params }),
  
  getAuditLogById: (id: string) => api.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`),

  getAuditLogsByEntity: (entityType: string, entityId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ auditLogs: AuditLog[]; pagination: PaginationInfo }>>(`/audit-logs/${entityType}/${entityId}`, { params }),

  getAuditLogStats: () => api.get<ApiResponse<{
    totalLogs: number;
    todayLogs: number;
    actionBreakdown: Array<{ _id: string; count: number }>;
    entityTypeBreakdown: Array<{ _id: string; count: number }>;
  }>>('/audit-logs/stats'),

  deleteAuditLog: (id: string) => api.delete<ApiResponse>(`/audit-logs/${id}`),

  deleteOldAuditLogs: (days?: number) =>
    api.post<ApiResponse & { deletedCount?: number }>('/audit-logs/cleanup/old-logs', { days }),
};

// Categories API
export interface CategoryItem {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const categoriesApi = {
  getCategories: () => api.get<ApiResponse<{ categories: CategoryItem[] }>>('/categories'),
  getCategoryById: (id: string) => api.get<ApiResponse<{ category: CategoryItem }>>(`/categories/${id}`),
  createCategory: (data: { name: string; description?: string }) =>
    api.post<ApiResponse<{ category: CategoryItem }>>('/categories', data),
  updateCategory: (id: string, data: { name?: string; description?: string }) =>
    api.put<ApiResponse<{ category: CategoryItem }>>(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<ApiResponse>(`/categories/${id}`),
};

// Configuration API
export interface RoleColorConfig {
  role: string;
  badgeColor: string;
  displayLabel: string;
}

export interface StatusStyleConfig {
  status: string;
  classes: string;
  label: string;
}

export const configurationApi = {
  getAll: () => api.get<ApiResponse<Record<string, unknown>[]>>('/configuration'),
  getByKey: (key: string) => api.get<ApiResponse<{ key: string; value: unknown }>>(`/configuration/${key}`),
  update: (key: string, value: unknown) => api.put<ApiResponse>(`/configuration/${key}`, { value }),
  getRoleColors: () => api.get<ApiResponse<RoleColorConfig[]>>('/configuration/enum/role-colors'),
  getStatusStyles: () => api.get<ApiResponse<StatusStyleConfig[]>>('/configuration/enum/status-styles'),
};

export default api;