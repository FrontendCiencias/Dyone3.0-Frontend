export function roleCanManageAdminSettings(role) {
  const safeRole = String(role || "").toUpperCase();
  return (
    safeRole.startsWith("ADMIN") ||
    safeRole.startsWith("SECRETARY") ||
    safeRole.startsWith("DIRECTOR") ||
    safeRole.startsWith("PROMOTER")
  );
}
