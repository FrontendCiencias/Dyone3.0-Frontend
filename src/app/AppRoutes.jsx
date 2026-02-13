import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import LoginPage from "../modules/auth/pages/LoginPage";
import LandingPage from "../modules/landing/pages/LandingPage";
import AdminSettingsPage from "../modules/admin/pages/AdminSettingsPage";
import DashboardHome from "../modules/dashboard/pages/DashboardHome";
import StudentsPage from "../modules/students/pages/StudentsPage";

import { ROUTES } from "../config/routes";
import { useAuth } from "../lib/auth";
import DashboardNotFound from "../modules/dashboard/pages/DashboardNotFound";

function pickDefaultPrivateRoute(roles = []) {
  const list = Array.isArray(roles) ? roles : [];

  const role = list[0] || "";
  if (String(role).toUpperCase().startsWith("ADMIN")) return ROUTES.dashboardAdmin;
  return ROUTES.dashboard;
}

function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  return <Outlet />;
}

function PublicRoute() {
  const { isAuthenticated, roles } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={pickDefaultPrivateRoute(roles)} replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.landing} element={<LandingPage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.dashboard} element={<DashboardHome />} />
          <Route path={ROUTES.dashboardStudents} element={<StudentsPage />} />
          <Route path={ROUTES.dashboardAdmin} element={<AdminSettingsPage />} />
          <Route path="/dashboard/*" element={<DashboardNotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
    </Routes>
  );
}
