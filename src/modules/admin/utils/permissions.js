import { CAPABILITIES, hasCapability } from "../../auth/utils/capabilities";

export function roleCanManageAdminSettings(role) {
  return hasCapability(role, CAPABILITIES.adminSettingsEdit);
}
