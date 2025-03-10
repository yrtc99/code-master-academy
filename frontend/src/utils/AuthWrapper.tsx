import React from 'react';
import { AuthProvider } from './authContext';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
