export function createDebtorsPrintStorageKey(prefix = "payments-debtors-print") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveDebtorsPrintPayload(key, payload) {
  localStorage.setItem(key, JSON.stringify(payload));
}

export function resolveDebtorsPrintPayload(key) {
  if (!key) return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
