import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import LoginPage from '../modules/auth/pages/LoginPage';
import LandingPage from '../modules/landing/pages/LandingPage';
import AdminHome from '../modules/admin/AdminHome';
import { getToken, getUserRoles } from '../lib/authStorage';
import DashboardHome from '../modules/dashboard/pages/DashboardHome';

function PrivateRoute() {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function PublicRoute() {
  const token = getToken();
  if (token) {
    const roles = getUserRoles();
    if (roles && roles.length) {
      const role = roles[0];
      if (role.startsWith('SECRETARY')) {
        return <Navigate to="/dashboard" replace />;
      }
      if (role.startsWith('ADMIN')) {
        return <Navigate to="/admin" replace />;
      }
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route element={<PublicRoute />}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* Rutas protegidas */}
      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/admin" element={<AdminHome />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}