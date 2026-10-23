import { createPrintStorageKey, savePrintPayload, resolvePrintPayload } from "../../../shared/utils/printStorage.mjs";

export function createCajaArequipaPrintStorageKey(prefix = "payments-caja-arequipa-print") {
  return createPrintStorageKey(prefix);
}

export const saveCajaArequipaPrintPayload = savePrintPayload;
export const resolveCajaArequipaPrintPayload = resolvePrintPayload;
