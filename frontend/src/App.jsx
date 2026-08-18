import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DrowsinessPage } from './pages/DrowsinessPage';
import { TrafficSignPage } from './pages/TrafficSignPage';
import { ChallansPage } from './pages/ChallansPage';
import { HazardsPage } from './pages/HazardsPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { RulesPage } from './pages/RulesPage';
import { SafetyPage } from './pages/SafetyPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Index and Alias Routes */}
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />

        {/* AI & Telemetry Feature Routes */}
        <Route path="drowsiness" element={<DrowsinessPage />} />
        <Route path="traffic-sign" element={<TrafficSignPage />} />
        <Route path="traffic-signs" element={<Navigate to="/traffic-sign" replace />} />
        <Route path="safety" element={<SafetyPage />} />

        {/* Hazard & Directory Routes */}
        <Route path="hazards" element={<HazardsPage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="challans" element={<ChallansPage />} />
        <Route path="emergency" element={<EmergencyPage />} />

        {/* Fallback Catch-All Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
