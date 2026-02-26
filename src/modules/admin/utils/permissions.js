export function roleCanManageAdminSettings(role) {
  const safeRole = String(role || "").toUpperCase();
  return ["ADMIN", "SECRETARY", "DIRECTOR", "PROMOTER"].includes(safeRole);
}
