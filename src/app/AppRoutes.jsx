import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import LoginPage from "../modules/auth/pages/LoginPage";
import LandingPage from "../modules/landing/pages/LandingPage";
import AdminConfigPage from "../modules/admin/pages/AdminConfigPage";
import AdminDevPage from "../modules/admin/pages/AdminDevPage";
import AdminLegacyRedirectPage from "../modules/admin/pages/AdminLegacyRedirectPage";
import DashboardHome from "../modules/dashboard/pages/DashboardHome";
import StudentsPage from "../modules/students/pages/StudentsPage";
import StudentDetailPage from "../modules/students/pages/StudentDetailPage";
import FamiliesPage from "../modules/families/pages/FamiliesPage";
import FamilyDetailPage from "../modules/families/pages/FamilyDetailPage";
import EnrollmentsPage from "../modules/enrollments/pages/EnrollmentsPage";
import EnrollmentCaseCreatePage from "../modules/enrollments/pages/EnrollmentCaseCreatePage";
import PaymentsPage from "../modules/payments/pages/PaymentsPage";

import { ROUTES } from "../config/routes";
import { useAuth } from "../lib/auth";
import DashboardNotFound from "../modules/dashboard/pages/DashboardNotFound";
import { ThemeProvider } from "../config/theme";

function pickDefaultPrivateRoute(roles = []) {
  const list = Array.isArray(roles) ? roles : [];

  const role = list[0] || "";
  if (String(role).toUpperCase().startsWith("ADMIN")) return ROUTES.dashboardAdminSettings;
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
  const { activeRole } = useAuth();

  return (
    <ThemeProvider role={activeRole}>
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
            <Route path={ROUTES.dashboardStudentDetail()} element={<StudentDetailPage />} />
            <Route path={ROUTES.dashboardFamilies} element={<FamiliesPage />} />
            <Route path={ROUTES.dashboardEnrollments} element={<EnrollmentsPage />} />
            <Route path={ROUTES.dashboardEnrollmentCaseNew} element={<EnrollmentCaseCreatePage />} />
            <Route path={ROUTES.dashboardFamilyDetail()} element={<FamilyDetailPage />} />
            <Route path={ROUTES.dashboardPayments} element={<PaymentsPage />} />
            <Route path={ROUTES.dashboardAdmin} element={<AdminLegacyRedirectPage />} />
            <Route path={ROUTES.dashboardAdminSettings} element={<AdminConfigPage />} />
            <Route path={ROUTES.dashboardAdminDev} element={<AdminDevPage />} />
            <Route path="/dashboard/*" element={<DashboardNotFound />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
      </Routes>
    </ThemeProvider>
  );
}
