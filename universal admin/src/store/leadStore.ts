import { create } from 'zustand';
import type { Lead, CreateLeadData } from '@/types';
import {
  createLead as createLeadApi,
  getLeads as getLeadsApi,
  updateLeadStatus as updateLeadStatusApi,
  deleteLead as deleteLeadApi,
} from '@/api/leadApi';

interface LeadState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  fetchLeads: () => Promise<void>;
  addLead: (data: CreateLeadData) => Promise<boolean>;
  updateLeadStatus: (id: string, status: string) => Promise<boolean>;
  deleteLead: (id: string) => Promise<boolean>;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  loading: false,
  error: null,

  fetchLeads: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getLeadsApi();

      if ((response.status === 'success' || response.status === true) && response.data) {
        set({ leads: response.data, loading: false });
      } else {
        set({ loading: false, error: response.message || 'Failed to fetch leads' });
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as Error)?.message ||
        'Failed to fetch leads. Please try again.';
      set({ loading: false, error: errorMessage });
    }
  },

  addLead: async (data: CreateLeadData) => {
    set({ loading: true, error: null });
    try {
      const response = await createLeadApi(data);

      if (response.status === true && response.data) {
        await get().fetchLeads();
        set({ loading: false });
        return true;
      }

      set({ loading: false, error: response.message || 'Failed to create lead' });
      throw new Error(response.message || 'Failed to create lead');
    } catch (error) {
      console.error('Error creating lead:', error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as Error)?.message ||
        'Failed to create lead';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  updateLeadStatus: async (id: string, status: string) => {
    try {
      await updateLeadStatusApi(id, status);

      set((state) => ({
        leads: state.leads.map((lead) =>
          lead._id === id ? { ...lead, status: status as Lead['status'] } : lead
        ),
      }));

      return true;
    } catch (error) {
      console.error('Error updating lead status:', error);
      return false;
    }
  },

  deleteLead: async (id: string) => {
    try {
      await deleteLeadApi(id);

      set((state) => ({
        leads: state.leads.filter((lead) => lead._id !== id),
      }));

      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  },
}));
