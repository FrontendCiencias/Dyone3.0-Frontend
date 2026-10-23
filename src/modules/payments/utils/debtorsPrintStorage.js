import { createPrintStorageKey, savePrintPayload, resolvePrintPayload } from "../../../shared/utils/printStorage.mjs";

export function createDebtorsPrintStorageKey(prefix = "payments-debtors-print") {
  return createPrintStorageKey(prefix);
}

export const saveDebtorsPrintPayload = savePrintPayload;
export const resolveDebtorsPrintPayload = resolvePrintPayload;
