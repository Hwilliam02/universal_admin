import masterClient from './masterClient';

const PRODUCT_ID = import.meta.env.VITE_CALCULATOR_PRODUCT_ID;

export interface LoginPayload   { email: string; password: string; }
export interface RegisterPayload { username: string; email: string; password: string; }

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

/** Login via Universal Master — returns master + app access tokens */
export const masterLogin = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await masterClient.post('/universal-auth/login', {
    ...payload,
    product_id: PRODUCT_ID,
  });
  return data;
};

/** Register via Universal Master */
export const masterSignup = async (payload: RegisterPayload) => {
  const { data } = await masterClient.post('/universal-auth/signup', {
    ...payload,
    product_id: PRODUCT_ID,
  });
  return data;
};

/** Silently refresh the appAccessToken using the universal refresh token */
export const refreshAppToken = async (refreshToken: string): Promise<string> => {
  const { data } = await masterClient.post('/universal-auth/refresh-token', {
    refresh_token: refreshToken,
    product_id:    PRODUCT_ID,
  });
  return data.accessToken;
};
