function normalizeRole(role) {
  return String(role || "").toUpperCase().trim();
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
  return isAdminRole(role) || isSecretaryRole(role) || isDirectorRole(role) || isPromoterRole(role);
}

export function canAccessFamilies(role) {
  return isAdminRole(role) || isSecretaryRole(role);
}

export function canAccessEnrollments(role) {
  return isAdminRole(role) || isSecretaryRole(role);
}

export function canAccessPayments(role) {
  return isAdminRole(role) || isSecretaryRole(role);
}

export function canAccessAttendance(role) {
  return isAdminRole(role) || isAuxiliarRole(role);
}

export function canAccessAdmin(role) {
  return isAdminRole(role) || isSecretaryRole(role) || isDirectorRole(role) || isPromoterRole(role);
}

export function canAccessClassroomBoard(role) {
  return isAdminRole(role);
}
