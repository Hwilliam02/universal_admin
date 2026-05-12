import { api } from './axiosConfig';
import type { ApiResponse, Company, User, Order } from '@/types';

export interface CreateCompanyData {
  company_name: string;
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
  };
  address?: {
    street: string;
    city: string;
    country: string;
  };
  companyEmail: string;
  logoFile?: File;
}

export interface CreateOrderData {
  productName: string;
  quantity: number;
  price: number;
}

export interface CreateDispatcherData {
  name: string;
  email: string;
  password: string;
}

// Create a new company
export const createCompany = async (data: CreateCompanyData): Promise<ApiResponse<Company>> => {
  // Create FormData if logo file is present
  if (data.logoFile) {
    const formData = new FormData();
    formData.append('company_name', data.company_name);
    formData.append('companyEmail', data.companyEmail);
    formData.append('logo', data.logoFile);

    const response = await api.post('/company/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  }

  // No logo file, send JSON
  const response = await api.post('/company/create', data);
  return response.data;
};

// Create an order
export const createOrder = async (data: CreateOrderData): Promise<ApiResponse<Order>> => {
  const response = await api.post('/company/order', data);
  return response.data;
};

// Create a dispatcher
export const createDispatcher = async (data: CreateDispatcherData): Promise<ApiResponse<User>> => {
  const response = await api.post('/company/dispatcher', data);
  return response.data;
};

// Get dispatcher by ID
export const getDispatcherById = async (dispatcherId: string): Promise<ApiResponse<User>> => {
  const response = await api.get(`/company/dispatcher/${dispatcherId}`);
  return response.data;
};

// Get all orders
export const getOrders = async (): Promise<ApiResponse<Order[]>> => {
  const response = await api.get('/company/orders');
  return response.data;
};

// Soft delete company
export const softDeleteCompany = async (companyId: string): Promise<ApiResponse<Company>> => {
  const response = await api.patch(`/company/soft-delete/${companyId}`);
  return response.data;
};

// Undelete company
export const undeleteCompany = async (companyId: string): Promise<ApiResponse<Company>> => {
  const response = await api.patch(`/company/undelete/${companyId}`);
  return response.data;
};

// Enable/disable supplies for a company
export const updateCompanySuppliesStatus = async (companyId: string, is_supplies_enabled: boolean): Promise<ApiResponse<Company>> => {
  const response = await api.patch(`/company/supplies/${companyId}`, { is_supplies_enabled });
  return response.data;
};

// Check company name availability
export const checkCompanyNameAvailability = async (companyName: string): Promise<ApiResponse<{ available: boolean; company_name: string }>> => {
  const response = await api.get(`/company/check-name-availability?company_name=${encodeURIComponent(companyName)}`);
  return response.data;
};

// Request tenant admin access (sets tenant cookie on backend)
export const requestAdminAccess = async (adminId: string, companyId: string): Promise<ApiResponse<unknown>> => {
  const response = await api.post(`/company/request-admin/${adminId}?companyId=${companyId}`, { companyId });
  return response.data;
};

// Resend company registration request
export const resendCompanyRegistration = async (adminId: string): Promise<ApiResponse<unknown>> => {
  const response = await api.patch(`/company/resend-registration-request/${adminId}`);
  return response.data;
};

export const companyApi = {
  createCompany,
  createOrder,
  createDispatcher,
  getDispatcherById,
  getOrders,
  softDeleteCompany,
  undeleteCompany,
  updateCompanySuppliesStatus,
  checkCompanyNameAvailability,
  requestAdminAccess,
  resendCompanyRegistration,
};

export default companyApi;
