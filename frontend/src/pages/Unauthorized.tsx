import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from 'app';
import { getUserProfile } from '../utils/userRoles';
import { getUserRole } from '../utils/roleUtils';
import { useEffect, useState } from 'react';

export default function Unauthorized() {
  const { user } = useCurrentUser();
  const [role, setRole] = useState<string>('Not signed in');
  
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.uid) {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setRole(profile.role);
        }
      }
    };
    
    fetchUserRole();
  }, [user]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-base text-gray-500">
            You don't have permission to access this page.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="mb-4 text-gray-700">
              Your current role: <span className="font-semibold">{role}</span>
            </p>
            <div className="mt-6">
              <Link
                to="/dashboard"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to your dashboard
              </Link>
            </div>
            <div className="mt-4">
              <Link
                to="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Home Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
