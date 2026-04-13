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
  dashboardClassrooms: "/dashboard/classrooms",
  dashboardStudentsPrintCards: "/dashboard/students/print-cards",
  dashboardStudentsPrintCardsPreview: "/dashboard/students/print-cards/preview",
  dashboardStudentDetail: (studentId = ":studentId") => `/dashboard/students/${studentId}`,
  dashboardEnrollments: "/dashboard/enrollments",
  dashboardEnrollmentNew: "/dashboard/enrollments/new",
  dashboardEnrollmentDetail: (enrollmentId = ":enrollmentId") => `/dashboard/enrollments/${enrollmentId}`,
  dashboardEnrollmentContractPreview: "/dashboard/enrollments/contract-preview",
  dashboardPayments: "/dashboard/payments",
  dashboardPaymentsCajaArequipa: "/dashboard/payments/caja-arequipa",
  dashboardPaymentsCajaArequipaPrintPreview: "/dashboard/payments/caja-arequipa/print-preview",
  dashboardPaymentsDailyCash: "/dashboard/payments/daily-cash",
  dashboardPaymentsDebtorsPrint: "/dashboard/payments/debtors/print",
  dashboardPaymentsDebtorsPrintPreview: "/dashboard/payments/debtors/print/preview",
  dashboardPaymentsDebtorsLettersPreview: "/dashboard/payments/debtors/print/letters-preview",
  dashboardPaymentDetail: (studentId = ":studentId") => `/dashboard/payments/${studentId}`,
  dashboardActivities: "/dashboard/activities",
  dashboardActivityDetail: (activityId = ":activityId") => `/dashboard/activities/${activityId}`,
  dashboardActivityPaidList: (activityId = ":activityId") => `/dashboard/activities/${activityId}/lista`,
  dashboardPrograms: "/dashboard/programs",
  dashboardProgramDetail: (programId = ":programId") => `/dashboard/programs/${programId}`,
  dashboardProgramSessionDetail: (programId = ":programId", sessionId = ":sessionId") => `/dashboard/programs/${programId}/sessions/${sessionId}`,
  dashboardAdmin: "/dashboard/admin",
  dashboardAdminSettings: "/dashboard/admin/settings",
  dashboardAdminDev: "/dashboard/admin/dev",

  // placeholders
  dashboardPlaceholder: "/dashboard/placeholder",
};
