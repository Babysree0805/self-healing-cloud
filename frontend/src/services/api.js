import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sre_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (username, password) => {
    const res = await apiClient.post('/auth/login', { username, password });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

export const telemetryApi = {
  getOverview: async () => {
    const res = await apiClient.get('/telemetry/overview');
    return res.data;
  },
  getPods: async () => {
    const res = await apiClient.get('/telemetry/pods');
    return res.data;
  },
};

export const servicesApi = {
  getAll: async () => {
    const res = await apiClient.get('/services/');
    return res.data;
  },
  getLogs: async (serviceName) => {
    const res = await apiClient.get(`/services/${serviceName}/logs`);
    return res.data;
  },
};

export const incidentsApi = {
  getAll: async () => {
    const res = await apiClient.get('/incidents/');
    return res.data;
  },
  getActive: async () => {
    const res = await apiClient.get('/incidents/active');
    return res.data;
  },
  getStats: async () => {
    const res = await apiClient.get('/incidents/stats');
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/incidents/${id}`);
    return res.data;
  },
};

export const agentsApi = {
  getLogs: async () => {
    const res = await apiClient.get('/agents/logs');
    return res.data;
  },
  getLiveStream: async () => {
    const res = await apiClient.get('/agents/live-stream');
    return res.data;
  },
  triggerManualHeal: async (serviceName) => {
    const res = await apiClient.post(`/agents/trigger-heal/${serviceName}`);
    return res.data;
  },
};

export const chaosApi = {
  injectFault: async (serviceName, failureType, intensity = 1.0, durationSeconds = 60) => {
    const res = await apiClient.post('/chaos/inject', {
      service_name: serviceName,
      failure_type: failureType,
      intensity,
      duration_seconds: durationSeconds,
    });
    return res.data;
  },
  clearFault: async (serviceName) => {
    const res = await apiClient.post(`/chaos/clear/${serviceName}`);
    return res.data;
  },
  resetAll: async () => {
    const res = await apiClient.post('/chaos/reset-all');
    return res.data;
  },
  getActiveFaults: async () => {
    const res = await apiClient.get('/chaos/active-faults');
    return res.data;
  },
};

export const knowledgeBaseApi = {
  getAll: async () => {
    const res = await apiClient.get('/knowledge-base/');
    return res.data;
  },
  getStats: async () => {
    const res = await apiClient.get('/knowledge-base/stats');
    return res.data;
  },
};

export default apiClient;
