import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import LoginPage from "../modules/auth/pages/LoginPage";
import LandingPage from "../modules/landing/pages/LandingPage";
import AdminHome from "../modules/admin/AdminHome";
import DashboardHome from "../modules/dashboard/pages/DashboardHome";

import { ROUTES } from "../config/routes";
import { useAuth } from "../lib/auth";
import DashboardNotFound from "../modules/dashboard/pages/DashboardNotFound";

function pickDefaultPrivateRoute(roles = []) {
  const list = Array.isArray(roles) ? roles : [];

  const role = list[0] || "";
  if (role.startsWith("ADMIN")) return ROUTES.admin;
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
      {/* Públicas */}
      <Route element={<PublicRoute />}>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.landing} element={<LandingPage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
        </Route>
      </Route>

      {/* Privadas */}
      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.dashboard} element={<DashboardHome />} />
          <Route path={ROUTES.admin} element={<AdminHome />} />
          {/* 404 interno del dashboard */}
          <Route path="/dashboard/*" element={<DashboardNotFound />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
    </Routes>
  );
}
