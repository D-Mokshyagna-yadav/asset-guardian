import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { User, Device, Department, Location, Assignment, AuditLog } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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

      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(error);
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

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
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
  
  updateProfile: (data: Partial<User>) => api.patch<ApiResponse<{ user: User }>>('/auth/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    }),
};

// Users API
export const usersApi = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) => api.get<PaginatedResponse<User>>('/users', { params }),
  
  getUserById: (id: string) => api.get<ApiResponse<{ user: User }>>(`/users/${id}`),
  
  createUser: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => api.post<ApiResponse<{ user: User }>>('/users', data),
  
  updateUser: (id: string, data: Partial<User>) =>
    api.patch<ApiResponse<{ user: User }>>(`/users/${id}`, data),
  
  deleteUser: (id: string) => api.delete<ApiResponse>(`/users/${id}`),
  
  toggleUserStatus: (id: string) =>
    api.patch<ApiResponse<{ user: User }>>(`/users/${id}/status`),
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
  }) => api.get<PaginatedResponse<Device>>('/devices', { params }),
  
  getDeviceById: (id: string) => api.get<ApiResponse<{ device: Device }>>(`/devices/${id}`),
  
  createDevice: (data: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => api.post<ApiResponse<{ device: Device }>>('/devices', data),
  
  updateDevice: (id: string, data: Partial<Device>) =>
    api.patch<ApiResponse<{ device: Device }>>(`/devices/${id}`, data),
  
  deleteDevice: (id: string) => api.delete<ApiResponse>(`/devices/${id}`),
  
  getDeviceStats: () => api.get<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byDepartment: Record<string, number>;
  }>>('/devices/stats'),
  
  getAvailableQuantity: (id: string) =>
    api.get<ApiResponse<{ total: number; assigned: number; available: number }>>(`/devices/${id}/availability`),
};

// Departments API
export const departmentsApi = {
  getDepartments: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get<PaginatedResponse<Department>>('/departments', { params }),
  
  getDepartmentById: (id: string) => api.get<ApiResponse<{ department: Department }>>(`/departments/${id}`),
  
  createDepartment: (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<{ department: Department }>>('/departments', data),
  
  updateDepartment: (id: string, data: Partial<Department>) =>
    api.patch<ApiResponse<{ department: Department }>>(`/departments/${id}`, data),
  
  deleteDepartment: (id: string) => api.delete<ApiResponse>(`/departments/${id}`),
};

// Locations API
export const locationsApi = {
  getLocations: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    building?: string;
  }) => api.get<PaginatedResponse<Location>>('/locations', { params }),
  
  getLocationById: (id: string) => api.get<ApiResponse<{ location: Location }>>(`/locations/${id}`),
  
  createLocation: (data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<{ location: Location }>>('/locations', data),
  
  updateLocation: (id: string, data: Partial<Location>) =>
    api.patch<ApiResponse<{ location: Location }>>(`/locations/${id}`, data),
  
  deleteLocation: (id: string) => api.delete<ApiResponse>(`/locations/${id}`),
  
  getBuildings: () => api.get<ApiResponse<{ buildings: string[] }>>('/locations/buildings/list'),
  
  getLocationsByBuilding: (building: string) => 
    api.get<PaginatedResponse<Location>>(`/locations/building/${building}`),
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
  
  createAssignment: (data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<{ assignment: Assignment }>>('/assignments', data),
  
  updateAssignment: (id: string, data: Partial<Assignment>) =>
    api.patch<ApiResponse<{ assignment: Assignment }>>(`/assignments/${id}`, data),
  
  approveAssignment: (id: string, data: { locationId?: string; departmentId?: string }) =>
    api.post<ApiResponse<{ assignment: Assignment }>>(`/assignments/${id}/approve`, data),
  
  rejectAssignment: (id: string, data: { rejectionReason: string }) =>
    api.post<ApiResponse<{ assignment: Assignment }>>(`/assignments/${id}/reject`, data),
  
  completeAssignment: (id: string) =>
    api.post<ApiResponse<{ assignment: Assignment }>>(`/assignments/${id}/complete`),
  
  deleteAssignment: (id: string) => api.delete<ApiResponse>(`/assignments/${id}`),
};

// Audit Logs API
export const auditLogsApi = {
  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<PaginatedResponse<AuditLog>>('/audit-logs', { params }),
  
  getAuditLogById: (id: string) => api.get<ApiResponse<{ log: AuditLog }>>(`/audit-logs/${id}`),
  
  getEntityAuditLogs: (entityType: string, entityId: string, params?: {
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResponse<AuditLog>>(`/audit-logs/${entityType}/${entityId}`, { params }),
  
  deleteAuditLog: (id: string) => api.delete<ApiResponse>(`/audit-logs/${id}`),
  
  deleteOldLogs: (daysOld: number) => 
    api.post<ApiResponse>('/audit-logs/cleanup/old-logs', { daysOld }),
};

export default api;