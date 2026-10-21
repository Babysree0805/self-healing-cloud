import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('velocity_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  register: async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password, role: 'rider' });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export const pricingApi = {
  getCategories: async (distance_km = 6.5, duration_min = 18.0) => {
    const res = await api.get(`/pricing/categories?distance_km=${distance_km}&duration_min=${duration_min}`);
    return res.data;
  },
  getSurge: async () => {
    const res = await api.get('/pricing/surge-status');
    return res.data;
  }
};

export const ridesApi = {
  requestRide: async (rideRequest) => {
    const res = await api.post('/rides/request', rideRequest);
    return res.data;
  },
  getPendingRides: async (rideType = null) => {
    const url = rideType ? `/rides/pending?ride_type=${rideType}` : '/rides/pending';
    const res = await api.get(url);
    return res.data;
  },
  acceptRide: async (rideId, driverId = 'DRV-001') => {
    const res = await api.post(`/rides/${rideId}/accept`, { driver_id: driverId });
    return res.data;
  },
  captainArrived: async (rideId) => {
    const res = await api.post(`/rides/${rideId}/arrived`);
    return res.data;
  },
  startTrip: async (rideId, otp = null) => {
    const url = otp ? `/rides/${rideId}/start?otp=${otp}` : `/rides/${rideId}/start`;
    const res = await api.post(url);
    return res.data;
  },
  getRideStatus: async (rideId) => {
    const res = await api.get(`/rides/${rideId}`);
    return res.data;
  },
  listRides: async () => {
    const res = await api.get('/rides/list');
    return res.data;
  },
  cancelRide: async (rideId) => {
    const res = await api.post(`/rides/${rideId}/cancel`);
    return res.data;
  },
  completeRide: async (rideId) => {
    const res = await api.post(`/rides/${rideId}/complete`);
    return res.data;
  }
};

export const driverApi = {
  listDrivers: async () => {
    const res = await api.get('/drivers/list');
    return res.data;
  },
  getAvailable: async () => {
    const res = await api.get('/drivers/available');
    return res.data;
  },
  getStats: async (driverId = 'DRV-001') => {
    const res = await api.get(`/drivers/${driverId}/stats`);
    return res.data;
  },
  setDuty: async (driverId, isOnline) => {
    const res = await api.post(`/drivers/${driverId}/duty?is_online=${isOnline}`);
    return res.data;
  },
  completeTrip: async (driverId, fare = 85.0) => {
    const res = await api.post(`/drivers/${driverId}/complete-trip?fare_amount=${fare}`);
    return res.data;
  },
  sendTelemetry: async (data) => {
    const res = await api.post('/drivers/telemetry', data);
    return res.data;
  }
};

export const locationApi = {
  updateCoords: async (data) => {
    const res = await api.post('/location/update', data);
    return res.data;
  },
  getNearby: async (lat = 12.9716, lng = 77.5946, radius = 5.0) => {
    const res = await api.get(`/location/nearby?lat=${lat}&lng=${lng}&radius_km=${radius}`);
    return res.data;
  }
};

export const notificationsApi = {
  sendSOS: async (title, message, severity = 'CRITICAL') => {
    const res = await api.post('/notifications/send', {
      title,
      message,
      channel: 'PAGERDUTY_AND_SLACK',
      severity
    });
    return res.data;
  },
  getList: async () => {
    const res = await api.get('/notifications/list');
    return res.data;
  }
};

export const telemetryApi = {
  getOverview: async () => {
    const res = await api.get('/telemetry/overview');
    return res.data;
  }
};

export const chaosApi = {
  getActiveFaults: async () => {
    const res = await api.get('/chaos/active-faults');
    return res.data;
  },
  injectFault: async (serviceName, failureType, intensity = 1.0, duration = 60) => {
    const res = await api.post('/chaos/inject', {
      service_name: serviceName,
      failure_type: failureType,
      intensity,
      duration_seconds: duration,
    });
    return res.data;
  },
  clearFault: async (serviceName) => {
    const res = await api.post(`/chaos/clear/${serviceName}`);
    return res.data;
  },
  resetAll: async () => {
    const res = await api.post('/chaos/reset-all');
    return res.data;
  }
};

export const agentsApi = {
  triggerManualHeal: async (serviceName) => {
    const res = await api.post(`/agents/trigger-heal/${serviceName}`);
    return res.data;
  },
  getLiveStream: async () => {
    const res = await api.get('/agents/live-stream');
    return res.data;
  }
};

export default api;
