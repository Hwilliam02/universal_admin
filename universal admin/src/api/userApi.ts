import { api } from './axiosConfig';
import type { ApiResponse, User, Company, GlobalUser } from '@/types';

export interface CreateSuperAdminData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string[];
}

// Create super admin
export const createSuperAdmin = async (data: CreateSuperAdminData): Promise<ApiResponse<User>> => {
  const response = await api.post('/users/create-super-admin', data);
  return response.data;
};

// Get all tenants/companies (for super admin) or company users (for admin)
export const getTenantUsers = async (): Promise<ApiResponse<Company[]>> => {
  const response = await api.get('/users/tenents');
  console.log(response.data);
  return response.data;
};

// Get users by company ID
export const getCompanyUsers = async (companyId: string): Promise<ApiResponse<User[]>> => {
  const response = await api.get(`/users/company/${companyId}`);
  return response.data;
};

// Update user status
export const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<ApiResponse<User>> => {
  const response = await api.patch(`/users/${userId}/status`, { status });
  return response.data;
};

export const restoreUser = async (userId: string): Promise<ApiResponse<User>> => {
  const response = await api.patch(`/users/undelete/${userId}`);
  return response.data;
};

export const getGlobalUsers = async (): Promise<ApiResponse<GlobalUser[]>> => {
  const response = await api.get('/users/global');
  return response.data;
};

export const updateGlobalUserStatus = async (globalUserId: string, status: 'Active' | 'Suspended'): Promise<ApiResponse<GlobalUser>> => {
  const response = await api.patch(`/users/global/${globalUserId}/status`, { status });
  return response.data;
};

export const userApi = {
  createSuperAdmin,
  getTenantUsers,
  getCompanyUsers,
  updateUserStatus,
  restoreUser,
  getGlobalUsers,
  updateGlobalUserStatus,
};


export default userApi;
