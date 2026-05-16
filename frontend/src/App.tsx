/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import ClassDetail from './pages/ClassDetail';
import TeacherProfile from './pages/TeacherProfile';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
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

export default function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <Router>
          <Routes>
            {/* Auth routes (no layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* App routes (with layout) */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
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
            </Route>
          </Routes>
        </Router>
      </RoleProvider>
    </AuthProvider>
  );
}
