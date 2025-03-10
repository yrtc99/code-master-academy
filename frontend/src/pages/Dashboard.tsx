import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserGuardContext } from 'app';
import { UserProfile } from '../utils/userRoles';
import { getUserRole } from '../utils/roleUtils';

export default function Dashboard() {
  // This is a router component that redirects users based on their role
  const { user } = useUserGuardContext();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        // Get user profile with role
        const role = await getUserRole(user.uid);
        if (role) {
          setUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: role,
            createdAt: new Date().toISOString()
          });
        }
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.uid]);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/login" />;
  }

  // Redirect to the appropriate dashboard based on user role
  if (userProfile && userProfile.role === 'teacher') {
    return <Navigate to="/teacher-dashboard" />;
  } else if (userProfile && userProfile.role === 'student') {
    return <Navigate to="/student-dashboard" />;
  }
  
  // This is a loading state while checking the user role
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}


