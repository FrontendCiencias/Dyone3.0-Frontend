// src/config/routes.js
export const ROUTES = {
  landing: "/",
  login: "/login",

  dashboard: "/dashboard",

  // Dashboard subroutes
  dashboardAttendance: "/dashboard/attendance",
  dashboardAttendanceIntake: "/dashboard/attendance/intake",
  dashboardAttendanceTake: (sessionId = ":sessionId") => `/dashboard/attendance/intake/${sessionId}`,
  dashboardAttendanceJustifications: "/dashboard/attendance/justifications",
  dashboardAttendanceReports: "/dashboard/attendance/reports",
  dashboardStudents: "/dashboard/students",
  dashboardStudentsPrintCards: "/dashboard/students/print-cards",
  dashboardStudentsPrintCardsPreview: "/dashboard/students/print-cards/preview",
  dashboardStudentDetail: (studentId = ":studentId") => `/dashboard/students/${studentId}`,
  dashboardEnrollments: "/dashboard/enrollments",
  dashboardEnrollmentNew: "/dashboard/enrollments/new",
  dashboardEnrollmentDetail: (enrollmentId = ":enrollmentId") => `/dashboard/enrollments/${enrollmentId}`,
  dashboardEnrollmentContractPreview: "/dashboard/enrollments/contract-preview",
  dashboardPayments: "/dashboard/payments",
  dashboardPaymentDetail: (studentId = ":studentId") => `/dashboard/payments/${studentId}`,
  dashboardAdmin: "/dashboard/admin",
  dashboardAdminSettings: "/dashboard/admin/settings",
  dashboardAdminDev: "/dashboard/admin/dev",

  // placeholders
  dashboardPlaceholder: "/dashboard/placeholder",
};
