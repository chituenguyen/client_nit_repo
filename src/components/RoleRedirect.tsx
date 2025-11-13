import { Navigate } from 'react-router-dom';
import { UserRole } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function RoleRedirect() {
  const user = useAuthStore(state => state.user);
  return user?.role === UserRole.LECTURER
    ? <Navigate to="/lecturer" replace />
    : <Navigate to="/student" replace />;
}