export const API_ROUTES = {
  login: "/api/auth/login",
  me: "/api/auth/me",

  adminCampuses: "/api/admin/campuses",
  adminCycles: "/api/admin/cycles",
  adminClassrooms: "/api/admin/classrooms",
  adminBillingConcepts: "/api/admin/billing-concepts",
  adminEndpoints: "/api/admin/endpoints",

  students: "/api/students",
  studentsByCampus: (campus) => `/api/students/campus/${campus}`,
  studentSummary: (id) => `/api/students/${id}/summary`,
  createStudentWithPerson: "/api/students/with-person",

  familiesLinkStudent: "/api/families/link-student",

  enrollments: "/api/enrollments",
};
