import axios from "axios";
import { store } from "../store/store";

// Use the same hostname the browser is on, so the app works on both
// localhost and LAN IP addresses without changing config.
const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000/api`;

const api = axios.create({ baseURL: apiBaseURL, withCredentials: true });

// Attach token from Redux store for requests
api.interceptors.request.use((cfg) => {
	const state = store.getState();
	const token = state.user?.accessToken || null;
	if (token && cfg.headers) {
		cfg.headers.Authorization = `Bearer ${token}`;
	}
	return cfg;
});

export default api;
