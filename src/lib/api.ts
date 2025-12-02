import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('admin_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await api.get<T>(url);
    return response.data;
  },

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await api.post<T>(url, data);
    return response.data;
  },

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await api.put<T>(url, data);
    return response.data;
  },

  async delete<T>(url: string): Promise<T> {
    const response = await api.delete<T>(url);
    return response.data;
  },
};

// Dashboard API functions
export const dashboardApi = {
  // Stats
  async getStats() {
    return apiClient.get<{
      totalUsers: number;
      activeSubscriptions: number;
      totalRevenue: number;
      serversLoad: number;
    }>('/admin/stats');
  },

  // Users
  async getUsers(page = 1, pageSize = 20) {
    return apiClient.get(`/admin/users?page=${page}&pageSize=${pageSize}`);
  },

  async getUser(userId: string) {
    return apiClient.get(`/admin/users/${userId}`);
  },

  // Servers
  async getServers() {
    return apiClient.get('/admin/servers');
  },

  async updateServer(serverId: string, data: any) {
    return apiClient.put(`/admin/servers/${serverId}`, data);
  },

  // Payments
  async getPayments(page = 1, pageSize = 20) {
    return apiClient.get(`/admin/payments?page=${page}&pageSize=${pageSize}`);
  },

  // Subscriptions
  async getSubscriptions(page = 1, pageSize = 20) {
    return apiClient.get(`/admin/subscriptions?page=${page}&pageSize=${pageSize}`);
  },
};

export default api;

