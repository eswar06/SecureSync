import axios from 'axios';
import { ApiResponse, User } from '@securesync/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  organization: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  register: async (userData: RegisterData): Promise<ApiResponse<LoginResponse>> => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await axios.post(`${API_BASE_URL}/auth/logout`, {
      refreshToken,
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>> => {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email,
    });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
      token,
      password,
    });
    return response.data;
  },
};
