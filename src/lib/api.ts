import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { User, Device } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', {
      email,
      password,
    }),
  
  logout: () => api.post<ApiResponse>('/auth/logout'),
  
  getProfile: () => api.get<ApiResponse<{ user: User }>>('/auth/profile'),
  
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

export default api;