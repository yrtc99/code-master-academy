import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserRole, saveUserRole } from '../utils/userRoles';
import { firebaseAuth, firebaseApp } from 'app';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const db = getFirestore(firebaseApp);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // Check if coming from Google Auth
    const fromAuth = searchParams.get('fromAuth');
    if (fromAuth === 'true') {
      setIsGoogleAuth(true);
      
      // If coming from Google Auth, try to pre-fill information
      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        if (currentUser.displayName) setFullName(currentUser.displayName);
        if (currentUser.email) setEmail(currentUser.email);
      }
    }
    
    // Check for role preference
    const roleParam = searchParams.get('role');
    if (roleParam === 'teacher' || roleParam === 'student') {
      setRole(roleParam as UserRole);
    } else {
      // Fallback to localStorage if no query param
      const preferredRole = localStorage.getItem('preferredRole');
      if (preferredRole === 'teacher' || preferredRole === 'student') {
        setRole(preferredRole as UserRole);
        // Remove the preference after using it
        localStorage.removeItem('preferredRole');
      }
    }
  }, [location.search]);

  // Helper function to convert Firebase error codes to user-friendly messages
  const getErrorMessage = (error: AuthError) => {
    console.log('Firebase error code:', error.code);
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Invalid email format. Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Account creation is currently disabled. Please try again later.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      default:
        console.error('Firebase auth error:', error);
        return 'Error creating account. Please try again later.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!isGoogleAuth) {
      if (password !== confirmPassword) {
        return setError('Passwords do not match');
      }
      
      if (password.length < 6) {
        return setError('Password must be at least 6 characters long');
      }
    }

    setIsLoading(true);

    try {
      let userId;
      
      if (isGoogleAuth) {
        // User already authenticated with Google
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }
        userId = currentUser.uid;
        
        // Update display name if needed
        if (currentUser.displayName !== fullName) {
          await updateProfile(currentUser, { displayName: fullName });
        }
      } else {
        // Create new user with email/password
        const trimmedEmail = email.trim();
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, trimmedEmail, password);
        const user = userCredential.user;
        
        // Update the user's display name
        await updateProfile(user, { displayName: fullName });
        userId = user.uid;
      }
      
      // Save user profile with role in Firestore
      await saveUserRole(userId, {
        email: firebaseAuth.currentUser?.email,
        displayName: fullName,
        role,
        createdAt: new Date().toISOString()
      });
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(getErrorMessage(err as AuthError));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const user = result.user;
      
      // Check if user already has a profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // User already has a profile, redirect to dashboard
        navigate('/dashboard');
        return;
      }
      
      // User doesn't have a profile yet, set Google auth flag and pre-fill info
      setIsGoogleAuth(true);
      if (user.displayName) setFullName(user.displayName);
      if (user.email) setEmail(user.email);
      
      // Now the user needs to select a role and complete registration
    } catch (err: any) {
      console.error('Google sign up error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign up was cancelled. Please try again.');
      } else {
        setError('Failed to sign up with Google. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">CodeMentor Academy</h2>
          <h3 className="mt-1 text-xl">Create your account</h3>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isGoogleAuth}
                  className={`appearance-none block w-full px-3 py-2 border ${isGoogleAuth ? 'bg-gray-100' : ''} border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {isGoogleAuth && <p className="mt-1 text-xs text-gray-500">Email is provided by Google and cannot be changed</p>}
              </div>
            </div>

            {!isGoogleAuth && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required={!isGoogleAuth}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required={!isGoogleAuth}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </>  
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a:
              </label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    id="student"
                    name="role"
                    type="radio"
                    value="student"
                    checked={role === 'student'}
                    onChange={() => setRole('student')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="student" className="ml-2 block text-sm text-gray-700">
                    Student
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="teacher"
                    name="role"
                    type="radio"
                    value="teacher"
                    checked={role === 'teacher'}
                    onChange={() => setRole('teacher')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="teacher" className="ml-2 block text-sm text-gray-700">
                    Teacher
                  </label>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>

          {!isGoogleAuth && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                    </g>
                  </svg>
                  Sign up with Google
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
