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
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    }),
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
    departmentId?: string;
  }) => api.get<PaginatedResponse<Location>>('/locations', { params }),
  
  getLocationById: (id: string) => api.get<ApiResponse<{ location: Location }>>(`/locations/${id}`),
  
  getLocationsByDepartment: (departmentId: string) => 
    api.get<ApiResponse<{ locations: Location[] }>>(`/locations/department/${departmentId}`),
  
  createLocation: (data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<{ location: Location }>>('/locations', data),
  
  updateLocation: (id: string, data: Partial<Location>) =>
    api.patch<ApiResponse<{ location: Location }>>(`/locations/${id}`, data),
  
  deleteLocation: (id: string) => api.delete<ApiResponse>(`/locations/${id}`),
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
};

// Categories API
export const categoriesApi = {
  getCategories: () => api.get<ApiResponse<{ categories: string[] }>>('/categories'),
  createCategory: (data: { name: string; description?: string }) =>
    api.post<ApiResponse>('/categories', data),
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
  getRoleColors: () => api.get<ApiResponse<RoleColorConfig[]>>('/configuration/enum/role-colors'),
  getStatusStyles: () => api.get<ApiResponse<StatusStyleConfig[]>>('/configuration/enum/status-styles'),
};

export default api;