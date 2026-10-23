import { createPrintStorageKey, savePrintPayload, resolvePrintPayload } from "../../../shared/utils/printStorage.mjs";

export function createClassroomRosterPrintStorageKey(prefix = "classroom-roster-print") {
  return createPrintStorageKey(prefix);
}

export const saveClassroomRosterPrintPayload = savePrintPayload;
export const resolveClassroomRosterPrintPayload = resolvePrintPayload;
