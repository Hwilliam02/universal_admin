import { api } from './axiosConfig';

export interface LogQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  action?: string;
  module?: string;
  companyName?: string;
  platform?: string;
  source?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  severity?: string; // exceptions only
}

export const getActivityLogs = async (params: LogQuery) => {
  const res = await api.get('/logs/activity', { params });
  return res.data;
};

export const getExceptionLogs = async (params: LogQuery) => {
  const res = await api.get('/logs/exceptions', { params });
  return res.data;
};

export default {
  getActivityLogs,
  getExceptionLogs,
};
