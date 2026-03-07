// src/config/routes.js
export const ROUTES = {
  landing: "/",
  login: "/login",

  dashboard: "/dashboard",

  // Dashboard subroutes
  dashboardStudents: "/dashboard/students",
  dashboardStudentsPrintCards: "/dashboard/students/print-cards",
  dashboardStudentsPrintCardsPreview: "/dashboard/students/print-cards/preview",
  dashboardStudentDetail: (studentId = ":studentId") => `/dashboard/students/${studentId}`,
  dashboardEnrollments: "/dashboard/enrollments",
  dashboardEnrollmentCaseNew: "/dashboard/enrollments/new",
  dashboardEnrollmentContractPreview: "/dashboard/enrollments/contract-preview",
  dashboardFamilies: "/dashboard/families",
  dashboardFamilyNew: "/dashboard/families/new",
  dashboardFamilyDetail: (familyId = ":familyId") => `/dashboard/families/${familyId}`,
  dashboardPayments: "/dashboard/payments",
  dashboardAdmin: "/dashboard/admin",
  dashboardAdminSettings: "/dashboard/admin/settings",
  dashboardAdminDev: "/dashboard/admin/dev",

  // placeholders
  dashboardPlaceholder: "/dashboard/placeholder",
};
