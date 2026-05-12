import { api } from './axiosConfig';
import type { ApiResponse, Lead } from '@/types';

export interface CreateLeadPayload {
  company_name?: string;
  contact_person?: string;
  email: string;
  phone?: string;
  service_area?: string;
  delivery_type?: string;
  notes?: string;
  logoFile?: File;
  company_type?: string;
  delivery_model?: string;
  monthly_order_value?: string;
  implementation_timeline?: string;
  your_role?: string;
  fleet_size?: string;
}

// Create a new lead
export const createLead = async (data: CreateLeadPayload): Promise<ApiResponse<Lead>> => {
  if (data.logoFile) {
    const formData = new FormData();
    if (data.company_name) formData.append('company_name', data.company_name);
    if (data.contact_person) formData.append('contact_person', data.contact_person);
    formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    if (data.service_area) formData.append('service_area', data.service_area);
    if (data.delivery_type) formData.append('delivery_type', data.delivery_type);
    if (data.notes) formData.append('notes', data.notes);
    if (data.company_type) formData.append('company_type', data.company_type);
    if (data.delivery_model) formData.append('delivery_model', data.delivery_model);
    if (data.monthly_order_value) formData.append('monthly_order_value', data.monthly_order_value);
    if (data.implementation_timeline) formData.append('implementation_timeline', data.implementation_timeline);
    if (data.your_role) formData.append('your_role', data.your_role);
    if (data.fleet_size) formData.append('fleet_size', data.fleet_size);
    formData.append('logo', data.logoFile);

    const response = await api.post('/lead/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const response = await api.post('/lead/create', data);
  return response.data;
};

// Get all leads
export const getLeads = async (): Promise<ApiResponse<Lead[]>> => {
  const response = await api.get('/lead/all');
  return response.data;
};

// Update lead status
export const updateLeadStatus = async (id: string, status: string): Promise<ApiResponse<Lead>> => {
  const response = await api.patch(`/lead/status/${id}`, { status });
  return response.data;
};

// Delete a lead
export const deleteLead = async (id: string): Promise<ApiResponse<unknown>> => {
  const response = await api.delete(`/lead/${id}`);
  return response.data;
};

export const leadApi = {
  createLead,
  getLeads,
  updateLeadStatus,
  deleteLead,
};

export default leadApi;
