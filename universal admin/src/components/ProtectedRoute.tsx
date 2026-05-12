import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is specified, check if user has at least one matching role
  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    const userRoles = Array.isArray(user.role) ? user.role : [user.role];
    const hasAccess = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasAccess) {
      // Redirect to appropriate dashboard based on role
      if (userRoles.includes('lead')) {
        return <Navigate to="/lead-dashboard" replace />;
      }
      if (userRoles.includes('developer') || userRoles.includes('dev')) {
        return <Navigate to="/dev" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
