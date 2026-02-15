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
  studentCycleStatus: (id) => `/api/students/${id}/cycle-status`,
  studentClassroom: (id) => `/api/students/${id}/classroom`,
  createStudentWithPerson: "/api/students/with-person",
  studentsSearch: "/api/students/search",
  createTutor: "/api/tutors",

  familiesSearch: "/api/families/search",
  // TODO (backend): ensure /api/families/search supports tutor+students fields (dni/names/lastNames/phone) for ventanilla search,
  familyDetail: (id) => `/api/families/${id}`,
  families: "/api/families",
  familiesLinkStudent: "/api/families/link-student",
  // TODO (backend): define dedicated endpoint to attach tutor directly to family (e.g. POST /api/families/:id/tutors).
  familyTutors: (id) => `/api/families/${id}/tutors`,
  // TODO (backend): endpoint required to change primary tutor
  familyPrimaryTutor: (id) => `/api/families/${id}/primary-tutor`,

  enrollments: "/api/enrollments",
  enrollmentConfirm: (id) => `/api/enrollments/${id}/confirm`,
  enrollmentClassroomCapacity: (classroomId) => `/api/enrollments/classrooms/${classroomId}/capacity`,
  charges: "/api/charges",
};
