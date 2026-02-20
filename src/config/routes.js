// src/config/routes.js
export const ROUTES = {
  landing: "/",
  login: "/login",

  dashboard: "/dashboard",

  // Dashboard subroutes
  dashboardStudents: "/dashboard/students",
  dashboardStudentDetail: (studentId = ":studentId") => `/dashboard/students/${studentId}`,
  dashboardEnrollments: "/dashboard/enrollments",
  dashboardEnrollmentCaseNew: "/dashboard/enrollments/new",
  dashboardFamilies: "/dashboard/families",
  dashboardFamilyDetail: (familyId = ":familyId") => `/dashboard/families/${familyId}`,
  dashboardPayments: "/dashboard/payments",
  dashboardAdmin: "/dashboard/admin",
  dashboardAdminSettings: "/dashboard/admin/settings",
  dashboardAdminDev: "/dashboard/admin/dev",

  // placeholders
  dashboardPlaceholder: "/dashboard/placeholder",
};
