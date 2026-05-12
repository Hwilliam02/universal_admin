import { api } from './axiosConfig';
import type { ApiResponse } from '@/types';

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

export const getAllProducts = async (): Promise<ApiResponse<Product[]>> => {
  const response = await api.get('/products');
  return response.data;
};

export const getProductById = async (id: string): Promise<ApiResponse<Product>> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const updateProductVerificationMethod = async (
  id: string,
  verification_method: 'code' | 'link' | 'none'
): Promise<ApiResponse<Product>> => {
  const response = await api.patch(`/products/${id}/verification-method`, { verification_method });
  return response.data;
};

export const productApi = {
  getAllProducts,
  getProductById,
  updateProductVerificationMethod,
};

export default productApi;
