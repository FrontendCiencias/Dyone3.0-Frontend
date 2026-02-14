// src/config/routes.js
export const ROUTES = {
  landing: "/",
  login: "/login",

  dashboard: "/dashboard",

  // Dashboard subroutes
  dashboardStudents: "/dashboard/students",
  dashboardStudentDetail: (studentId = ":studentId") => `/dashboard/students/${studentId}`,
  dashboardEnrollments: "/dashboard/enrollments",
  dashboardFamilies: "/dashboard/families",
  dashboardPayments: "/dashboard/payments",
  dashboardAdmin: "/dashboard/admin",

  // placeholders
  dashboardPlaceholder: "/dashboard/placeholder",
};
