import { CAPABILITIES, hasCapability, normalizeCapabilityRole } from "./capabilities";

function normalizeRole(role) {
  return normalizeCapabilityRole(role);
}

export function isAdminRole(role) {
  return normalizeRole(role) === "ADMIN";
}

export function isSecretaryRole(role) {
  const safeRole = normalizeRole(role);
  return safeRole === "SECRETARY" || safeRole === "SECRETARY_VIEWER";
}

export function isAuxiliarRole(role) {
  return normalizeRole(role) === "AUXILIAR";
}

export function isDirectorRole(role) {
  return normalizeRole(role) === "DIRECTOR";
}

export function isPromoterRole(role) {
  return normalizeRole(role) === "PROMOTER";
}

export function canAccessStudents(role) {
  return hasCapability(role, CAPABILITIES.studentsView);
}

export function canAccessEnrollments(role) {
  return hasCapability(role, CAPABILITIES.enrollmentsView);
}

export function canAccessPayments(role) {
  return hasCapability(role, CAPABILITIES.paymentsView);
}

export function canAccessAttendance(role) {
  return hasCapability(role, CAPABILITIES.attendanceView);
}

export function canAccessAdmin(role) {
  return hasCapability(role, CAPABILITIES.adminView);
}

export function canAccessClassroomBoard(role) {
  return hasCapability(role, CAPABILITIES.classroomsBoardView);
}

export function canAccessPrograms(role) {
  return isAdminRole(role);
}
