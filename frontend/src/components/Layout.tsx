import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, MapPin, MessageSquare, User, LayoutDashboard, Menu, ArrowRightLeft, LogIn, LogOut } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/dataServices';
import { socketService } from '../services/socketService';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useRole();
  const { user, isAuthenticated, logout } = useAuth();

  const toggleRole = () => {
    if (role === 'student') {
      setRole('teacher');
      navigate('/teacher');
    } else {
      setRole('student');
      navigate('/student');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to socket if not already connected
      const token = localStorage.getItem('accessToken');
      if (token) {
        socketService.connect(token);
        const socket = socketService.getSocket();
        
        if (socket) {
          socket.on('newDirectMessage', (message: any) => {
            if (message.receiver === user._id) {
              setUnreadCount(prev => prev + 1);
            }
          });
        }
      }

      // Fetch initial unread count
      messageService.getUnreadCount()
        .then(res => setUnreadCount(res.data.count))
        .catch(console.error);
    }
    
    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('newDirectMessage');
      }
    };
  }, [isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Menu className="h-6 w-6 text-gray-500 sm:hidden" />
            <Link to={role === 'student' ? '/' : '/teacher'} className="text-xl font-bold text-indigo-600 flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              LocalLearn
            </Link>
          </div>

          <nav className="hidden sm:flex space-x-8">
            {role === 'student' ? (
              <>
                <Link to="/" className={`text-sm font-medium ${location.pathname === '/' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
                  Discover
                </Link>
                {isAuthenticated && (
                  <Link to="/student" className={`text-sm font-medium ${location.pathname.startsWith('/student') ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
                    My Classes
                  </Link>
                )}
              </>
            ) : (
              <>
                {isAuthenticated && (
                  <Link to="/teacher" className={`text-sm font-medium ${location.pathname === '/teacher' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
                    Dashboard
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <button 
                onClick={toggleRole}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Viewing as: {role === 'student' ? 'Student' : 'Teacher'}
              </button>
            )}

            {isAuthenticated ? (
              <>
                <Link to="/messages" className="p-2 text-gray-400 hover:text-gray-500 relative">
                  <MessageSquare className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 border-2 border-white text-[8px] font-bold text-white flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                  {user?.name?.charAt(0) || <User className="h-5 w-5" />}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 w-full bg-white border-t flex justify-around p-3 z-50">
        {role === 'student' ? (
          <>
            <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-indigo-600' : 'text-gray-500'}`}>
              <Search className="h-5 w-5" />
              <span className="text-[10px] font-medium">Discover</span>
            </Link>
            {isAuthenticated && (
              <Link to="/student" className={`flex flex-col items-center gap-1 ${location.pathname.startsWith('/student') ? 'text-indigo-600' : 'text-gray-500'}`}>
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-[10px] font-medium">My Classes</span>
              </Link>
            )}
          </>
        ) : (
          <>
            {isAuthenticated && (
              <Link to="/teacher" className={`flex flex-col items-center gap-1 ${location.pathname === '/teacher' ? 'text-indigo-600' : 'text-gray-500'}`}>
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-[10px] font-medium">Dashboard</span>
              </Link>
            )}
          </>
        )}
        {isAuthenticated ? (
          <button onClick={toggleRole} className="flex flex-col items-center gap-1 text-gray-500">
            <ArrowRightLeft className="h-5 w-5" />
            <span className="text-[10px] font-medium">Switch Role</span>
          </button>
        ) : (
          <Link to="/login" className="flex flex-col items-center gap-1 text-gray-500">
            <LogIn className="h-5 w-5" />
            <span className="text-[10px] font-medium">Sign In</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
