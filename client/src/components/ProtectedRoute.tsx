import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session } = useAuth();

  if (!session) {
    return <Login />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
