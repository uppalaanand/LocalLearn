/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Feedback from './components/Feedback';
import Layout from './components/Layout';
import Teachers from './pages/Teachers';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import ClassDetail from './pages/ClassDetail';
import TeacherProfile from './pages/TeacherProfile';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import UserProfile from './pages/UserProfile';
import ClassManagement from './pages/ClassManagement';
import Login from './pages/Login';
import Register from './pages/Register';
import Messages from './pages/Messages';
import { RoleProvider } from './context/RoleContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function DashboardRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? (user.role === 'teacher' ? '/teacher' : '/student') : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <Router>
          <Feedback />
          <Routes>
            {/* Auth routes (no layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* App routes (with layout) */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="dashboard" element={<DashboardRedirect />} />
              <Route path="*" element={<div className="py-20 text-center"><h1 className="text-3xl font-bold">Page not found</h1><p className="my-4">This page does not exist.</p><Link to="/" className="mr-6 text-indigo-600">Home</Link><Link to="/dashboard" className="text-indigo-600">My dashboard</Link></div>} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="search" element={<SearchResults />} />
              <Route path="class/:id" element={<ClassDetail />} />
              <Route path="teacher/:id" element={<TeacherProfile />} />
              <Route path="student" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="teacher" element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } />
              <Route path="class-management/:id" element={
                <ProtectedRoute>
                  <ClassManagement />
                </ProtectedRoute>
              } />
              <Route path="messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </Router>
      </RoleProvider>
    </AuthProvider>
  );
}
