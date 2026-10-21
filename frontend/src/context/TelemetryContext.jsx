import React, { createContext, useContext, useState, useEffect } from 'react';
import { telemetryApi, servicesApi, incidentsApi, agentsApi, chaosApi } from '../services/api';

const TelemetryContext = createContext();

export const TelemetryProvider = ({ children }) => {
  const [overview, setOverview] = useState({
    overall_health: 100.0,
    cluster_status: 'OPTIMAL',
    total_services: 8,
    healthy_services: 8,
    degraded_services: 0,
    critical_services: 0,
    active_incidents: 0,
    total_pods: 8,
    avg_cpu_usage: 18.5,
    avg_memory_usage: 28.0,
    total_requests_per_sec: 420.0,
    avg_latency_ms: 45.0,
    agent_status: 'ACTIVE_MONITORING',
  });

  const [services, setServices] = useState([]);
  const [pods, setPods] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [agentEvents, setAgentEvents] = useState([]);
  const [activeFaults, setActiveFaults] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const fetchAllData = async () => {
    try {
      const [ov, srvs, pdList, incList, actIncList, agLogs, faults] = await Promise.allSettled([
        telemetryApi.getOverview(),
        servicesApi.getAll(),
        telemetryApi.getPods(),
        incidentsApi.getAll(),
        incidentsApi.getActive(),
        agentsApi.getLiveStream(),
        chaosApi.getActiveFaults(),
      ]);

      if (ov.status === 'fulfilled' && ov.value) setOverview(ov.value);
      if (srvs.status === 'fulfilled' && Array.isArray(srvs.value)) setServices(srvs.value);
      if (pdList.status === 'fulfilled' && Array.isArray(pdList.value)) setPods(pdList.value);
      if (incList.status === 'fulfilled' && Array.isArray(incList.value)) setIncidents(incList.value);
      if (actIncList.status === 'fulfilled' && Array.isArray(actIncList.value)) setActiveIncidents(actIncList.value);
      if (agLogs.status === 'fulfilled' && Array.isArray(agLogs.value) && agLogs.value.length > 0) {
        setAgentEvents((prev) => {
          const combined = [...agLogs.value, ...prev];
          const unique = Array.from(new Map(combined.map(item => [(item.timestamp || '') + (item.agent_name || '') + (item.action || ''), item])).values());
          return unique.slice(0, 40);
        });
      }
      if (faults.status === 'fulfilled' && Array.isArray(faults.value)) setActiveFaults(faults.value);
      setIsConnected(true);
    } catch (err) {
      console.error('Error refreshing telemetry:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);

    // Setup SSE connection
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/v1/stream/events');
      eventSource.onopen = () => setIsConnected(true);
      eventSource.onmessage = (event) => {
        try {
          if (!event.data) return;
          const parsed = JSON.parse(event.data);
          if (parsed.event_type === 'AGENT_STEP' && parsed.data) {
            setAgentEvents((prev) => [parsed.data, ...prev.slice(0, 39)]);
          } else if (parsed.event_type === 'INCIDENT_RESOLVED') {
            fetchAllData();
          }
        } catch (e) {
          // ignore heartbeat comments or non-json data
        }
      };
      eventSource.onerror = () => {
        // SSE disconnected, fallback polling handles it seamlessly
      };
    } catch (e) {
      console.warn('SSE not supported or disabled, using live polling');
    }

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, []);

  return (
    <TelemetryContext.Provider
      value={{
        overview,
        services,
        pods,
        incidents,
        activeIncidents,
        agentEvents,
        activeFaults,
        isConnected,
        refreshData: fetchAllData,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => useContext(TelemetryContext);
