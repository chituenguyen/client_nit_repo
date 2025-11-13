import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '../types';
import type { ReactNode } from 'react';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
  const isLoading = useAuthStore(state => state.isLoading);
  const user = useAuthStore(state => state.user);  

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === UserRole.STUDENT) {
      return <Navigate to="/student" replace />;
    } else {
      return <Navigate to="/lecturer" replace />;
    }
  }

  return <>{children}</>;
}