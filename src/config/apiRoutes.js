export const API_ROUTES = {
  login: "/api/auth/login",
  me: "/api/auth/me",

  adminCampuses: "/api/admin/campuses",
  adminCycles: "/api/admin/cycles",
  adminClassrooms: "/api/admin/classrooms",
  adminBillingConcepts: "/api/admin/billing-concepts",
  adminEndpoints: "/api/admin/endpoints",
  adminModels: "/api/admin/models",

  students: "/api/students",
  studentsByCampus: (campus) => `/api/students/campus/${campus}`,
  studentSummary: (id) => `/api/students/${id}/summary`,
  studentCycleStatus: (id) => `/api/students/${id}/cycle-status`,
  studentClassroom: (id) => `/api/students/${id}/classroom`,
  studentIdentity: (id) => `/api/students/${id}/identity`,
  // TODO (backend): implement PATCH /api/students/:id/identity to update editable identity fields (names, lastNames, dni) and return updated student.
  studentInternalNotes: (id) => `/api/students/${id}/internal-notes`,
  // TODO (backend): implement PATCH /api/students/:id/internal-notes to save secretariat notes (internalNotes) and return updated student summary/detail.
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
  enrollmentCases: "/api/enrollment-cases",
  // TODO (backend): implement EnrollmentCase draft flow (create/list/detail) with fields: id, campusId/campusCode, cycleId, status, familyId, enrollmentStudents[].
  enrollmentCaseDetail: (id) => `/api/enrollment-cases/${id}`,
  enrollmentCaseConfirm: (id) => `/api/enrollment-cases/${id}/confirm`,
  // TODO (backend): confirm should return updated case + summary { studentsConfirmedCount, chargesCreatedCount }.
  enrollmentCaseAddStudent: (id) => `/api/enrollment-cases/${id}/students`,
  enrollmentCaseUpdateStudent: (caseId, esId) => `/api/enrollment-cases/${caseId}/students/${esId}`,
  enrollmentCaseSetFamily: (id) => `/api/enrollment-cases/${id}/family`,
  enrollmentCaseRemoveStudent: (caseId, esId) => `/api/enrollment-cases/${caseId}/students/${esId}`,
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
