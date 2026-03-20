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
import StudentPrintCardsPage from "../modules/students/pages/StudentPrintCardsPage";
import StudentPrintCardsPreviewPage from "../modules/students/pages/StudentPrintCardsPreviewPage";
import FamiliesPage from "../modules/families/pages/FamiliesPage";
import FamilyDetailPage from "../modules/families/pages/FamilyDetailPage";
import FamiliesNewPage from "../modules/families/pages/FamiliesNewPage";
import EnrollmentsPage from "../modules/enrollments/pages/EnrollmentsPage";
import EnrollmentCaseCreatePage from "../modules/enrollments/pages/EnrollmentCaseCreatePage";
import EnrollmentContractPreviewPage from "../modules/enrollments/pages/EnrollmentContractPreviewPage";
import PaymentsPage from "../modules/payments/pages/PaymentsPage";
import PaymentStudentDetailPage from "../modules/payments/pages/PaymentStudentDetailPage";
import AttendanceIntakePage from "../modules/attendance/pages/AttendanceIntakePage";
import AttendanceTakePage from "../modules/attendance/pages/AttendanceTakePage";
import AttendanceJustificationsPage from "../modules/attendance/pages/AttendanceJustificationsPage";
import AttendanceReportsPage from "../modules/attendance/pages/AttendanceReportsPage";

import { ROUTES } from "../config/routes";
import { useAuth } from "../lib/auth";
import DashboardNotFound from "../modules/dashboard/pages/DashboardNotFound";
import { ThemeProvider } from "../config/theme";
import {
  canAccessAdmin,
  canAccessAttendance,
  canAccessEnrollments,
  canAccessFamilies,
  canAccessPayments,
  canAccessStudents,
} from "../modules/auth/utils/roleAccess";

function pickDefaultPrivateRoute(roles = []) {
  const list = Array.isArray(roles) ? roles : [];

  const role = list[0] || "";
  if (String(role).toUpperCase() === "ADMIN") return ROUTES.dashboardAdminSettings;
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

function RoleRoute({ canAccess }) {
  const { activeRole, roles } = useAuth();
  const role = activeRole || roles?.[0] || "";

  if (!canAccess(role)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  const { activeCampus } = useAuth();

  return (
    <ThemeProvider campus={activeCampus}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.landing} element={<LandingPage />} />
            <Route path={ROUTES.login} element={<LoginPage />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path={ROUTES.dashboardEnrollmentContractPreview} element={<EnrollmentContractPreviewPage />} />
          <Route path={ROUTES.dashboardStudentsPrintCardsPreview} element={<StudentPrintCardsPreviewPage />} />
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.dashboard} element={<DashboardHome />} />
            <Route element={<RoleRoute canAccess={canAccessAttendance} />}>
              <Route path={ROUTES.dashboardAttendance} element={<AttendanceIntakePage />} />
              <Route path={ROUTES.dashboardAttendanceIntake} element={<Navigate to={ROUTES.dashboardAttendance} replace />} />
              <Route path={ROUTES.dashboardAttendanceTake()} element={<AttendanceTakePage />} />
              <Route path={ROUTES.dashboardAttendanceJustifications} element={<AttendanceJustificationsPage />} />
              <Route path={ROUTES.dashboardAttendanceReports} element={<AttendanceReportsPage />} />
            </Route>
            <Route element={<RoleRoute canAccess={canAccessStudents} />}>
              <Route path={ROUTES.dashboardStudents} element={<StudentsPage />} />
              <Route path={ROUTES.dashboardStudentsPrintCards} element={<StudentPrintCardsPage />} />
              <Route path={ROUTES.dashboardStudentDetail()} element={<StudentDetailPage />} />
            </Route>
            <Route element={<RoleRoute canAccess={canAccessFamilies} />}>
              <Route path={ROUTES.dashboardFamilies} element={<FamiliesPage />} />
              <Route path={ROUTES.dashboardFamilyNew} element={<FamiliesNewPage />} />
              <Route path={ROUTES.dashboardFamilyDetail()} element={<FamilyDetailPage />} />
            </Route>
            <Route element={<RoleRoute canAccess={canAccessEnrollments} />}>
              <Route path={ROUTES.dashboardEnrollments} element={<EnrollmentsPage />} />
              <Route path={ROUTES.dashboardEnrollmentCaseNew} element={<EnrollmentCaseCreatePage />} />
            </Route>
            <Route element={<RoleRoute canAccess={canAccessPayments} />}>
              <Route path={ROUTES.dashboardPayments} element={<PaymentsPage />} />
              <Route path={ROUTES.dashboardPaymentDetail()} element={<PaymentStudentDetailPage />} />
            </Route>
            <Route element={<RoleRoute canAccess={canAccessAdmin} />}>
              <Route path={ROUTES.dashboardAdmin} element={<AdminLegacyRedirectPage />} />
              <Route path={ROUTES.dashboardAdminSettings} element={<AdminConfigPage />} />
              <Route path={ROUTES.dashboardAdminDev} element={<AdminDevPage />} />
            </Route>
            <Route path="/dashboard/*" element={<DashboardNotFound />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
      </Routes>
    </ThemeProvider>
  );
}
