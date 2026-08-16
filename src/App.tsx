import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Sagas from './pages/Sagas';
import Designer from './pages/Designer';
import RunSaga from './pages/RunSaga';
import Executions from './pages/Executions';
import Execution from './pages/Execution';
import EventBus from './pages/EventBus';
import Download from './pages/Download';
import Guide from './pages/Guide';

function Shell({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<Shell><Dashboard /></Shell>} />
          <Route path="/app/services" element={<Shell><Services /></Shell>} />
          <Route path="/app/sagas" element={<Shell><Sagas /></Shell>} />
          <Route path="/app/sagas/:id" element={<Shell><Designer /></Shell>} />
          <Route path="/app/sagas/:id/run" element={<Shell><RunSaga /></Shell>} />
          <Route path="/app/executions" element={<Shell><Executions /></Shell>} />
          <Route path="/app/executions/:id" element={<Shell><Execution /></Shell>} />
          <Route path="/app/events" element={<Shell><EventBus /></Shell>} />
          <Route path="/app/download" element={<Shell><Download /></Shell>} />
          <Route path="/app/download/:sagaId" element={<Shell><Download /></Shell>} />
          <Route path="/app/guide" element={<Shell><Guide /></Shell>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
