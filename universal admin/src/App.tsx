import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import VerificationPage from '@/pages/VerificationPage';
import Dashboard from '@/pages/Dashboard';
import LeadDashboard from '@/pages/LeadDashboard';
import DeveloperDashboard from '@/pages/DeveloperDashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import LogsPage from '@/pages/LogsPage';
import CompanyAnalyticsPage from './pages/CompanyAnalyticsPage';
import SystemMonitorPage from './pages/SystemMonitorPage';
import RegisterProductForm from './pages/RegisterProductForm';
import ProductsDashboard from './pages/ProductsDashboard';
import UniversalUsersDashboard from './pages/UniversalUsersDashboard';

function RoleBasedRedirect() {
  const user = useAuthStore((state) => state.user);
  const userRoles: string[] = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
  
  if (userRoles.includes('lead')) {
    return <Navigate to="/lead-dashboard" replace />;
  }
  if (userRoles.includes('developer') || userRoles.includes('dev')) {
    return <Navigate to="/dev" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter basename='/superadmin'>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <RoleBasedRedirect />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerificationPage />} />

        {/* Protected routes - Superadmin only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev"
          element={
            <ProtectedRoute allowedRoles={['developer', 'dev']}>
              <DeveloperDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies/:companyId/analytics"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <CompanyAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Protected routes - Lead only */}
        <Route
          path="/lead-dashboard"
          element={
            <ProtectedRoute allowedRoles={['lead']}>
              <LeadDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected routes - Both roles */}
        <Route
          path="/logs"
          element={
            <ProtectedRoute allowedRoles={['superadmin', 'lead']}>
              <LogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitor"
          element={
            <ProtectedRoute allowedRoles={['superadmin', 'lead']}>
              <SystemMonitorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['developer', 'dev']}>
              <ProductsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <ProtectedRoute allowedRoles={['developer', 'dev']}>
              <RegisterProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/universal-users"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <UniversalUsersDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      
      <Toaster />
    </BrowserRouter>
  );
}

export default App

