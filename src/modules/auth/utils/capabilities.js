export const CAPABILITIES = {
  dashboardView: "dashboard.view",
  studentsView: "students.view",
  studentsEditIdentity: "students.edit_identity",
  studentsEditNotes: "students.edit_notes",
  studentsManageTutors: "students.manage_tutors",
  studentsDelete: "students.delete",
  studentsChangeClassroom: "students.change_classroom",
  studentsPrintCards: "students.print_cards",
  enrollmentsView: "enrollments.view",
  enrollmentsCreate: "enrollments.create",
  enrollmentsDetailView: "enrollments.detail_view",
  paymentsView: "payments.view",
  paymentsRegister: "payments.register",
  paymentsCreateCharge: "payments.create_charge",
  paymentsEditCharge: "payments.edit_charge",
  paymentsCorrectReceipt: "payments.correct_receipt",
  paymentsEditReceiptAmount: "payments.edit_receipt_amount",
  paymentsEditReceiptPaidAt: "payments.edit_receipt_paid_at",
  paymentsReassignReceipt: "payments.reassign_receipt",
  attendanceView: "attendance.view",
  adminView: "admin.view",
  adminSettingsEdit: "admin.settings.edit",
  adminDevView: "admin.dev.view",
  classroomsBoardView: "classrooms.board.view",
};

function normalizeRole(role) {
  return String(role || "").toUpperCase().trim();
}

const ALL_CAPABILITIES = Object.values(CAPABILITIES);

const ROLE_CAPABILITIES = {
  ADMIN: ALL_CAPABILITIES,
  SECRETARY: [
    CAPABILITIES.dashboardView,
    CAPABILITIES.studentsView,
    CAPABILITIES.studentsEditIdentity,
    CAPABILITIES.studentsEditNotes,
    CAPABILITIES.studentsManageTutors,
    CAPABILITIES.studentsChangeClassroom,
    CAPABILITIES.enrollmentsView,
    CAPABILITIES.enrollmentsCreate,
    CAPABILITIES.enrollmentsDetailView,
    CAPABILITIES.paymentsView,
    CAPABILITIES.paymentsRegister,
    CAPABILITIES.paymentsCreateCharge,
    CAPABILITIES.paymentsEditCharge,
    CAPABILITIES.paymentsCorrectReceipt,
  ],
  SECRETARY_VIEWER: [
    CAPABILITIES.dashboardView,
    CAPABILITIES.studentsView,
  ],
  AUXILIAR: [
    CAPABILITIES.dashboardView,
    CAPABILITIES.attendanceView,
  ],
  DIRECTOR: [
    CAPABILITIES.dashboardView,
    CAPABILITIES.studentsView,
  ],
  PROMOTER: [
    CAPABILITIES.dashboardView,
    CAPABILITIES.studentsView,
  ],
};

export function normalizeCapabilityRole(role) {
  return normalizeRole(role);
}

export function getRoleCapabilities(role) {
  return ROLE_CAPABILITIES[normalizeRole(role)] || [];
}

export function hasCapability(role, capability) {
  if (!capability) return false;
  return getRoleCapabilities(role).includes(capability);
}

export function hasAnyCapability(role, capabilities = []) {
  return capabilities.some((capability) => hasCapability(role, capability));
}
