import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserGuardContext, auth } from 'app';
import { getUserRole } from '../utils/roleUtils';

interface Props {
  children: ReactNode;
  title?: string;
  showNavigation?: boolean;
}

export function NeoLayout({ children, title, showNavigation = true }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserGuardContext();
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [isNavExpanded, setIsNavExpanded] = React.useState(false);
  
  // Determine active path
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };
  
  // Toggle mobile navigation
  const toggleNav = () => {
    setIsNavExpanded(!isNavExpanded);
  };

  React.useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const role = await getUserRole(user.uid);
        setUserRole(role);
      }
    };
    
    fetchUserRole();
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9]">
      {/* Mobile navigation toggle */}
      {showNavigation && (
        <button 
          onClick={toggleNav} 
          className="lg:hidden fixed top-4 left-4 z-50 neo-button p-2 bg-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isNavExpanded ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      )}
      
      {/* Left Navigation */}
      {showNavigation && (
        <nav className={`fixed z-40 bg-white border-r-3 border-black h-screen w-[240px] p-6 transition-transform duration-300 ${isNavExpanded ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex flex-col h-full">
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold mb-1">CodeMentor</h1>
              <p className="text-sm font-medium text-gray-600">Academy</p>
            </div>
            
            <div className="flex-grow">
              {/* Navigation items */}
              <div className="space-y-2 mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Main</h3>
                
                {userRole === 'teacher' ? (
                  <>
                    <button 
                      onClick={() => navigate('/teacher-dashboard')} 
                      className={isActivePath('/teacher-dashboard') ? 'neo-nav-link-active' : 'neo-nav-link'}
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => navigate('/LessonEditor')} 
                      className={isActivePath('/LessonEditor') ? 'neo-nav-link-active' : 'neo-nav-link'}
                    >
                      Lesson Editor
                    </button>
                  </>
                ) : userRole === 'student' ? (
                  <>
                    <button 
                      onClick={() => navigate('/student-dashboard')} 
                      className={isActivePath('/student-dashboard') ? 'neo-nav-link-active' : 'neo-nav-link'}
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => navigate('/course-history')} 
                      className={isActivePath('/course-history') ? 'neo-nav-link-active' : 'neo-nav-link'}
                    >
                      Course History
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => navigate('/dashboard')} 
                    className={isActivePath('/dashboard') ? 'neo-nav-link-active' : 'neo-nav-link'}
                  >
                    Dashboard
                  </button>
                )}
              </div>

              {/* Admin section - Only for teachers */}
              {userRole === 'teacher' && (
                <div className="space-y-2 mb-8">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Admin</h3>
                  <button 
                    onClick={() => navigate('/teacher-dashboard')} 
                    className="neo-nav-link bg-[#FFFDF9]">
                    Class Management
                  </button>
                </div>
              )}
            </div>
            
            {/* User info and logout */}
            <div className="border-t-3 border-black pt-4">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-[#FF5C00] flex items-center justify-center text-white font-bold mr-2">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold truncate">{user?.displayName || user?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{userRole || 'User'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="neo-button w-full bg-[#F2F2F2] text-black"
              >
                Log out
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={`${showNavigation ? 'lg:ml-[240px]' : ''} min-h-screen transition-all duration-300`}>
        {/* Page header */}
        {title && (
          <header className="border-b-3 border-black py-6 px-6 bg-white">
            <h1 className="text-3xl font-extrabold">{title}</h1>
          </header>
        )}
        
        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
