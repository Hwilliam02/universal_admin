// User type matching backend User model
export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string[];
  company_id?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdBy?: string;
  is_active?: boolean;
  is_deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Visa {
  _id: string;
  global_user_id: string;
  product_id: string;
  product_name?: string;
  role: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
  updatedAt: string;
}

export interface GlobalUser {
  _id: string;
  global_user_id: string;
  username?: string;
  email: string;
  status: 'Active' | 'Suspended';
  visas: Visa[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  product_id: string;
  name: string;
  architecture_type: 'SINGLE_DB' | 'MULTI_TENANT';
  db_driver: 'MONGODB' | 'MYSQL';
  db_uri: string;
  app_public_key: string;
  verification_method?: 'code' | 'link' | 'none';
  createdAt: string;
  updatedAt: string;
}

// Admin details for company
export interface CompanyAdmin {
  _id: string;
  global_user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted' | 'pending';
  createdAt?: string;
}

// Company type matching backend Company model
export interface Company {
  _id: string;
  name: string;
  domain?: string;
  productIds: string[];

  logoUrl?: string;
  db_uri?: string | null;
  dbName?: string | null;
  createdBy: string;
  admin_global_user_id?: string | null;
  admin_email?: string | null;
  admin_first_name?: string | null;
  admin_last_name?: string | null;
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
  status: 'active' | 'suspended' | 'inactive' | 'deleted' | 'pending';
  admin?: CompanyAdmin | null; // Admin details from aggregation
  displayEmail?: string; // Computed email for display
  userCount?: number;
  delivery_type?: string;
  is_supplies_enabled?: boolean;
  is_trial?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Clinic type matching backend


// Order type
export interface Order {
  id?: number;
  productName: string;
  quantity: number;
  price: number;
  company_id: string;
  dispatcher_id: string;
  createdAt?: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  verifySuperAdmin: (email: string, code: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string[];
}

export interface CreateCompanyData {
  company_name: string;
  domain?: string;

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
}

// API Response types
export interface ApiResponse<T = unknown> {
  status: string | boolean;
  message?: string;
  data?: T;
  token?: string;
  total?: number;
}

// Lead type matching backend Lead model
export interface Lead {
  _id: string;
  company_name?: string;
  contact_person?: string;
  email: string;
  phone?: string;
  service_area?: string;
  delivery_type?: 'willcall' | 'job';
  logo_url?: string;
  notes?: string;
  company_type?: string;
  delivery_model?: string;
  monthly_order_value?: string;
  implementation_timeline?: string;
  your_role?: string;
  fleet_size?: string;
  status: 'new' | 'contacted' | 'converted' | 'rejected';
  submitted_by: string | { _id: string; email: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLeadData {
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
