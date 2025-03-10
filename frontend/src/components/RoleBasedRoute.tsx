import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { UserGuard, useUserGuardContext } from 'app';
import { getUserProfile, UserRole } from '../utils/userRoles';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
  const { user } = useUserGuardContext();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.uid) {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUserRole(profile.role);
        }
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If roles are specified, check if user has the required role
  if (userRole && !allowedRoles.includes(userRole)) {
    // Redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Wrapper component that combines UserGuard and RoleBasedRoute
export function ProtectedRoleRoute({ children, allowedRoles }: RoleBasedRouteProps) {
  return (
    <UserGuard>
      <RoleBasedRoute allowedRoles={allowedRoles}>
        {children}
      </RoleBasedRoute>
    </UserGuard>
  );
}
