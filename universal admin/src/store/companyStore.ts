import { create } from 'zustand';
import type { Company, CreateCompanyData } from '@/types';
import { createCompany as createCompanyApi, softDeleteCompany as softDeleteCompanyApi, undeleteCompany as undeleteCompanyApi, updateCompanySuppliesStatus as updateCompanySuppliesStatusApi } from '@/api/companyApi';
import { getTenantUsers } from '@/api/userApi';
import { changeCompanyStatus } from '@/api/authApi';

interface CompanyState {
  companies: Company[];
  loading: boolean;
  error: string | null;
  fetchCompanies: () => Promise<void>;
  addCompany: (data: CreateCompanyData) => Promise<boolean>;
  updateCompanyStatus: (id: string, status: Company['status']) => Promise<boolean>;
  updateCompanySuppliesStatus: (id: string, isSuppliesEnabled: boolean) => Promise<boolean>;
  softDeleteCompany: (id: string) => Promise<boolean>;
  undeleteCompany: (id: string) => Promise<boolean>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  loading: false,
  error: null,

  fetchCompanies: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getTenantUsers();
      
      if ((response.status === 'success' || response.status === true) && response.data) {
        // Validate and clean company data
        const validatedCompanies = response.data.map((company: Company) => ({
          ...company,
          admin: company.admin || null,
          displayEmail: company.displayEmail || company.admin?.email || 'N/A'
        }));
        
        set({ companies: validatedCompanies, loading: false });
      } else {
        set({ loading: false, error: response.message || 'Failed to fetch companies' });
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      const errorMessage = 
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
        (error as Error)?.message || 
        'Failed to fetch companies. Please try again.';
      set({ loading: false, error: errorMessage });
    }
  },

  addCompany: async (data: CreateCompanyData) => {
    set({ loading: true, error: null });
    try {
      const response = await createCompanyApi(data);
      
      if (response.status === true && response.data) {
        // Refresh companies list
        await get().fetchCompanies();
        set({ loading: false });
        return true;
      }
      
      set({ loading: false, error: response.message || 'Failed to create company' });
      throw new Error(response.message || 'Failed to create company');
    } catch (error) {
      console.error('Error creating company:', error);
      const errorMessage = 
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
        (error as Error)?.message || 
        'Failed to create company';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  updateCompanyStatus: async (id: string, status: Company['status']) => {
    try {
      await changeCompanyStatus(id, status);
      
      set((state) => ({
        companies: state.companies.map((company) =>
          company._id === id ? { ...company, status } : company
        ),
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating company status:', error);
      return false;
    }
  },

  updateCompanySuppliesStatus: async (id: string, isSuppliesEnabled: boolean) => {
    try {
      await updateCompanySuppliesStatusApi(id, isSuppliesEnabled);

      set((state) => ({
        companies: state.companies.map((company) =>
          company._id === id ? { ...company, is_supplies_enabled: isSuppliesEnabled } : company
        ),
      }));

      return true;
    } catch (error) {
      console.error('Error updating company supplies status:', error);
      return false;
    }
  },

  softDeleteCompany: async (id: string) => {
    try {
      await softDeleteCompanyApi(id);
      
      set((state) => ({
        companies: state.companies.map((company) =>
          company._id === id ? { ...company, status: 'deleted' } : company
        ),
      }));
      
      return true;
    } catch (error) {
      console.error('Error soft deleting company:', error);
      return false;
    }
  },

  undeleteCompany: async (id: string) => {
    try {
      await undeleteCompanyApi(id);
      
      set((state) => ({
        companies: state.companies.map((company) =>
          company._id === id ? { ...company, status: 'inactive' } : company
        ),
      }));
      
      return true;
    } catch (error) {
      console.error('Error undeleting company:', error);
      return false;
    }
  },
}));
