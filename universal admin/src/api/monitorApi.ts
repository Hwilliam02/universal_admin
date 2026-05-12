import axios from 'axios';

// The monitor routes are on port 5000 (server2)
// We derive the base URL from the existing VITE_API_URL 
// but point it to the correct port/path for monitoring
const getMonitorBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL || '';

    // Case 1: Local or IP-based with explicit ports (4000 -> 5000)
    if (envUrl.includes(':4000')) {
        return envUrl.replace(':4000', ':5000').split('/server1')[0] + '/server2';
    }

    // Case 2: Production domain (e.g., https://api.com/server1/api/v1 -> https://api.com/server2)
    // We assume the backend port 5000 is mapped to /server2 on the same host
    if (envUrl.includes('/server1')) {
        return envUrl.split('/server1')[0] + '/server2';
    }

    // Fallback/Default
    return 'http://localhost:5000/server2';
};

const monitorApi = axios.create({
    baseURL: getMonitorBaseUrl(),
    withCredentials: true,
});

export const getLiveMonitorData = async () => {
    const res = await monitorApi.get('/monitor');
    return res.data;
};

export const getMonitorHistorySnapshots = async (limit = 20) => {
    const res = await monitorApi.get(`/monitor/history/snapshots?limit=${limit}`);
    return res.data;
};

export const getSlowApiHistory = async (limit = 20) => {
    const res = await monitorApi.get(`/monitor/history/slow-apis?limit=${limit}`);
    return res.data;
};

export const getErrorHistory = async (limit = 20) => {
    const res = await monitorApi.get(`/monitor/history/errors?limit=${limit}`);
    return res.data;
};
