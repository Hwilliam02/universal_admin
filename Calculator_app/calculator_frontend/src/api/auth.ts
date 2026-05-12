import axios from 'axios';

const CALC_URL = import.meta.env.VITE_CALC_BACKEND_URL || 'http://localhost:5000';
const authClient = axios.create({
  baseURL: CALC_URL,
  headers: { 'Content-Type': 'application/json' },
});

const AUTH_BASE = '/api/auth';
const PRODUCT_ID = import.meta.env.VITE_CALCULATOR_PRODUCT_ID;

export interface LoginPayload   { email: string; password: string; }
export interface RegisterPayload { username: string; email: string; password: string; }

export interface VerificationRequiredResponse {
  status: 'verification_required';
  method?: string;
  message: string;
  email?: string;
}

export interface AuthResponse {
  accessToken:    string;
  refreshToken:   string;
  appAccessToken: string;
  product_name:   string;
  user: {
    global_user_id:    string;
    global_company_id: string | null;
    email:             string;
    username:          string;
    visas:             unknown[];
  };
}

export type AuthResult = AuthResponse | VerificationRequiredResponse;

export interface VerifyPayload { email: string; verification_code: string; }

/** Login via Calculator backend gateway */
export const masterLogin = async (payload: LoginPayload): Promise<AuthResult> => {
  const { data } = await authClient.post(`${AUTH_BASE}/login`, {
    ...payload,
    product_id: PRODUCT_ID,
  });
  return data;
};

/** Register via Calculator backend gateway */
export const masterSignup = async (payload: RegisterPayload): Promise<AuthResult> => {
  const { data } = await authClient.post(`${AUTH_BASE}/signup`, {
    ...payload,
    product_id: PRODUCT_ID,
  });
  return data;
};

/** Verify user code via Calculator backend gateway */
export const verifyCode = async (payload: VerifyPayload): Promise<{ status: string; message: string }> => {
  const { data } = await authClient.post(`${AUTH_BASE}/verify`, payload);
  return data;
};


/** Silently refresh the appAccessToken using the calculator backend gateway */
export const refreshAppToken = async (refreshToken: string): Promise<string> => {
  const { data } = await authClient.post(`${AUTH_BASE}/refresh`, {
    refresh_token: refreshToken,
    product_id: PRODUCT_ID,
  });
  return data.accessToken;
};
