export interface User {
  global_user_id: string;
  global_company_id: string;
  email: string;
  username: string;
  visas: Visa[];
}

export interface Visa {
  product: string; // name
  product_id: string;
  role: string;
  status: string;
}

export interface Product {
  _id: string;
  product_id: string;
  name: string;
  architecture_type: string;
  db_driver: string;
  app_public_key: string;
}

export interface Company {
  _id: string;
  name: string;
  productIds: string[];
  status: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string, product_id?: string) => Promise<{ status: string; email?: string }>;
  verify: (email: string, code: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface ApiResponse<T = any> {
  status: string | boolean;
  message?: string;
  data?: T;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}
