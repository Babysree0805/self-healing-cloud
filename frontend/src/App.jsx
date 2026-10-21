import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TelemetryProvider } from './context/TelemetryContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MicroservicesPage } from './pages/MicroservicesPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AgentActivityPage } from './pages/AgentActivityPage';
import { ChaosSimulationPage } from './pages/ChaosSimulationPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col text-slate-100">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/microservices" element={<MicroservicesPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/agents" element={<AgentActivityPage />} />
            <Route path="/chaos" element={<ChaosSimulationPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TelemetryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </TelemetryProvider>
    </AuthProvider>
  );
}
