import { api } from './axiosConfig';
import type { ApiResponse, User } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SetPasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface VerificationData {
  email: string;
  code: string;
}

// Login endpoint
export const login = async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User }>> => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// Set new password for company admin
export const setCompanyPassword = async (
  userId: string,
  data: SetPasswordData
): Promise<ApiResponse> => {
  const response = await api.patch(`/auth/set-new-password/${userId}`, data);
  return response.data;
};

// Change company status
export const changeCompanyStatus = async (companyId: string, status: string): Promise<ApiResponse> => {
  const response = await api.patch(`/auth/change-status/${companyId}`, { status });
  return response.data;
};

// Verify super admin
export const verifySuperAdmin = async (data: VerificationData): Promise<ApiResponse<{ user: User }>> => {
  const response = await api.patch('/auth/verify', data);
  return response.data;
};

// Logout endpoint
export const logout = async (): Promise<ApiResponse> => {
  const response = await api.post('/auth/logout');
  return response.data;
};

// Refresh token endpoint
export const refreshSession = async (): Promise<ApiResponse<{ user: User }>> => {
  const response = await api.post('/auth/refresh');
  return response.data;
};

export const authApi = {
  login,
  setCompanyPassword,
  changeCompanyStatus,
  verifySuperAdmin,
  logout,
  refreshSession,
};

export default authApi;
