import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import LoginPage from "../modules/auth/pages/LoginPage";
import LandingPage from "../modules/landing/pages/LandingPage";
import AdminConfigPage from "../modules/admin/pages/AdminConfigPage";
import AdminDevPage from "../modules/admin/pages/AdminDevPage";
import AdminLegacyRedirectPage from "../modules/admin/pages/AdminLegacyRedirectPage";
import ProgramsPage from "../modules/admin/pages/ProgramsPage";
import ProgramDetailPage from "../modules/admin/pages/ProgramDetailPage";
import ProgramSessionDetailPage from "../modules/admin/pages/ProgramSessionDetailPage";
import DashboardHome from "../modules/dashboard/pages/DashboardHome";
import StudentsPage from "../modules/students/pages/StudentsPage";
import StudentDetailPage from "../modules/students/pages/StudentDetailPage";
import StudentPrintCardsPage from "../modules/students/pages/StudentPrintCardsPage";
import StudentPrintCardsPreviewPage from "../modules/students/pages/StudentPrintCardsPreviewPage";
import EnrollmentsPage from "../modules/enrollments/pages/EnrollmentsPage";
import MatriculasV2Page from "../modules/enrollments/pages/MatriculasV2Page";
import EnrollmentDetailPage from "../modules/enrollments/pages/EnrollmentDetailPage";
import EnrollmentContractPreviewPage from "../modules/enrollments/pages/EnrollmentContractPreviewPage";
import PaymentsPage from "../modules/payments/pages/PaymentsPage";
import PaymentsCajaArequipaPage from "../modules/payments/pages/PaymentsCajaArequipaPage";
import PaymentsCajaArequipaPrintPreviewPage from "../modules/payments/pages/PaymentsCajaArequipaPrintPreviewPage";
import PaymentsDailyCashPage from "../modules/payments/pages/PaymentsDailyCashPage";
import PaymentsDebtorsPrintPage from "../modules/payments/pages/PaymentsDebtorsPrintPage";
import PaymentsDebtorsPrintPreviewPage from "../modules/payments/pages/PaymentsDebtorsPrintPreviewPage";
import PaymentsDebtorsLettersPreviewPage from "../modules/payments/pages/PaymentsDebtorsLettersPreviewPage";
import PaymentStudentDetailPage from "../modules/payments/pages/PaymentStudentDetailPage";
import ActivitiesPage from "../modules/activities/pages/ActivitiesPage";
import ActivityDetailPage from "../modules/activities/pages/ActivityDetailPage";
import ActivityPaidListPage from "../modules/activities/pages/ActivityPaidListPage";
import ClassroomsBoardPage from "../modules/admin/pages/ClassroomsBoardPage";
import AttendanceIntakePage from "../modules/attendance/pages/AttendanceIntakePage";
import AttendanceTakePage from "../modules/attendance/pages/AttendanceTakePage";
import AttendanceJustificationsPage from "../modules/attendance/pages/AttendanceJustificationsPage";
import AttendanceReportsPage from "../modules/attendance/pages/AttendanceReportsPage";

import { ROUTES } from "../config/routes";
import { useAuth } from "../lib/auth";
import DashboardNotFound from "../modules/dashboard/pages/DashboardNotFound";
import { ThemeProvider } from "../config/theme";
import { CAPABILITIES, hasCapability } from "../modules/auth/utils/capabilities";

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

function CapabilityRoute({ capability }) {
  const { activeRole, roles } = useAuth();
  const role = activeRole || roles?.[0] || "";

  if (!hasCapability(role, capability)) {
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
          <Route element={<CapabilityRoute capability={CAPABILITIES.enrollmentsDetailView} />}>
            <Route path={ROUTES.dashboardEnrollmentContractPreview} element={<EnrollmentContractPreviewPage />} />
          </Route>
          <Route element={<CapabilityRoute capability={CAPABILITIES.studentsPrintCards} />}>
            <Route path={ROUTES.dashboardStudentsPrintCardsPreview} element={<StudentPrintCardsPreviewPage />} />
          </Route>
          <Route element={<CapabilityRoute capability={CAPABILITIES.paymentsPrintDebtors} />}>
            <Route path={ROUTES.dashboardPaymentsDebtorsPrintPreview} element={<PaymentsDebtorsPrintPreviewPage />} />
            <Route path={ROUTES.dashboardPaymentsDebtorsLettersPreview} element={<PaymentsDebtorsLettersPreviewPage />} />
          </Route>
          <Route element={<CapabilityRoute capability={CAPABILITIES.paymentsCajaArequipa} />}>
            <Route path={ROUTES.dashboardPaymentsCajaArequipaPrintPreview} element={<PaymentsCajaArequipaPrintPreviewPage />} />
          </Route>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.dashboard} element={<DashboardHome />} />

            <Route element={<CapabilityRoute capability={CAPABILITIES.attendanceView} />}>
              <Route path={ROUTES.dashboardAttendance} element={<AttendanceIntakePage />} />
              <Route path={ROUTES.dashboardAttendanceIntake} element={<Navigate to={ROUTES.dashboardAttendance} replace />} />
              <Route path={ROUTES.dashboardAttendanceTake()} element={<AttendanceTakePage />} />
              <Route path={ROUTES.dashboardAttendanceJustifications} element={<AttendanceJustificationsPage />} />
              <Route path={ROUTES.dashboardAttendanceReports} element={<AttendanceReportsPage />} />
            </Route>

            <Route element={<CapabilityRoute capability={CAPABILITIES.studentsView} />}>
              <Route path={ROUTES.dashboardStudents} element={<StudentsPage />} />
              <Route element={<CapabilityRoute capability={CAPABILITIES.classroomsBoardView} />}>
                <Route path={ROUTES.dashboardClassrooms} element={<ClassroomsBoardPage />} />
              </Route>
              <Route element={<CapabilityRoute capability={CAPABILITIES.studentsPrintCards} />}>
                <Route path={ROUTES.dashboardStudentsPrintCards} element={<StudentPrintCardsPage />} />
              </Route>
              <Route path={ROUTES.dashboardStudentDetail()} element={<StudentDetailPage />} />
            </Route>

            <Route element={<CapabilityRoute capability={CAPABILITIES.enrollmentsView} />}>
              <Route path={ROUTES.dashboardEnrollments} element={<EnrollmentsPage />} />
              <Route element={<CapabilityRoute capability={CAPABILITIES.enrollmentsCreate} />}>
                <Route path={ROUTES.dashboardEnrollmentNew} element={<MatriculasV2Page />} />
              </Route>
              <Route element={<CapabilityRoute capability={CAPABILITIES.enrollmentsDetailView} />}>
                <Route path={ROUTES.dashboardEnrollmentDetail()} element={<EnrollmentDetailPage />} />
              </Route>
            </Route>

            <Route element={<CapabilityRoute capability={CAPABILITIES.paymentsView} />}>
              <Route path={ROUTES.dashboardPayments} element={<PaymentsPage />} />
              <Route element={<CapabilityRoute capability={CAPABILITIES.paymentsCajaArequipa} />}>
                <Route path={ROUTES.dashboardPaymentsCajaArequipa} element={<PaymentsCajaArequipaPage />} />
              </Route>
              <Route path={ROUTES.dashboardPaymentsDailyCash} element={<PaymentsDailyCashPage />} />
              <Route element={<CapabilityRoute capability={CAPABILITIES.paymentsPrintDebtors} />}>
                <Route path={ROUTES.dashboardPaymentsDebtorsPrint} element={<PaymentsDebtorsPrintPage />} />
              </Route>
              <Route path={ROUTES.dashboardPaymentDetail()} element={<PaymentStudentDetailPage />} />
            </Route>

            <Route element={<CapabilityRoute capability={CAPABILITIES.activitiesView} />}>
              <Route path={ROUTES.dashboardActivities} element={<ActivitiesPage />} />
              <Route path={ROUTES.dashboardActivityDetail()} element={<ActivityDetailPage />} />
              <Route path={ROUTES.dashboardActivityPaidList()} element={<ActivityPaidListPage />} />
            </Route>

            <Route element={<CapabilityRoute capability={CAPABILITIES.adminView} />}>
              <Route path={ROUTES.dashboardPrograms} element={<ProgramsPage />} />
              <Route path={ROUTES.dashboardProgramSessionDetail()} element={<ProgramSessionDetailPage />} />
              <Route path={ROUTES.dashboardProgramDetail()} element={<ProgramDetailPage />} />
              <Route path={ROUTES.dashboardAdmin} element={<AdminLegacyRedirectPage />} />
              <Route path={ROUTES.dashboardAdminSettings} element={<AdminConfigPage />} />
              <Route element={<CapabilityRoute capability={CAPABILITIES.adminDevView} />}>
                <Route path={ROUTES.dashboardAdminDev} element={<AdminDevPage />} />
              </Route>
            </Route>

            <Route path="/dashboard/*" element={<DashboardNotFound />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
      </Routes>
    </ThemeProvider>
  );
}
