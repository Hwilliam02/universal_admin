import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const MASTER_URL = import.meta.env.VITE_MASTER_URL || 'http://localhost:4000/server1/api/v1';

export const masterClient = axios.create({
  baseURL: MASTER_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default masterClient;
