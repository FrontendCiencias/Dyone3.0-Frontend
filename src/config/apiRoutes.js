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
  familyDetail: (id) => `/api/families/${id}`,
  families: "/api/families",
  familiesLinkStudent: "/api/families/link-student",
  familyTutors: (id) => `/api/families/${id}/tutors`,
  familyPrimaryTutor: (id) => `/api/families/${id}/primary-tutor`,

  enrollments: "/api/enrollments",
  enrollmentsList: "/api/enrollments",
  // TODO (backend): implement GET /api/enrollments (list/search) for real enrollments board:
  // supports q, campus, cycleId, status, classroomId, limit, cursor; returns items + nextCursor with enrollmentId + student + cycle + classroom + status + confirmedAt.
  enrollmentDetail: (id) => `/api/enrollments/${id}`,
  enrollmentConfirm: (id) => `/api/enrollments/${id}/confirm`,
  enrollmentClassroomCapacity: (classroomId) => `/api/enrollments/classrooms/${classroomId}/capacity`,
  charges: "/api/charges",
  paymentsCreate: "/api/payments",
  paymentsDebtors: "/api/payments/debtors",
  payments: "/api/payments",
  studentAccountStatement: (studentId) => `/api/students/${studentId}/account-statement`,
  // TODO (backend): return charges + payments + totals (pending/overdue) for the student.
  studentCharges: (studentId) => `/api/students/${studentId}/charges`,
  // TODO (backend): list charges for a student (or use account-statement).
  studentPayments: (studentId) => `/api/students/${studentId}/payments`,
  // TODO (backend): list payments for a student (or use account-statement).
  // TODO (backend): support allocations to charges and update outstanding amounts.
};
