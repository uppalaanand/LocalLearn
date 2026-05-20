import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import StudentProfile from './StudentProfile';

export default function UserProfile() {
  const { user, isAuthenticated } = useAuth();
  const { role } = useRole();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'teacher') {
    return <Navigate to={`/teacher/${user._id}`} replace />;
  }

  return <StudentProfile />;
}
