export function createClassroomRosterPrintStorageKey(prefix = "classroom-roster-print") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveClassroomRosterPrintPayload(printKey, payload) {
  if (!printKey) return;
  localStorage.setItem(printKey, JSON.stringify(payload || {}));
}

export function resolveClassroomRosterPrintPayload(printKey) {
  if (!printKey) return null;

  try {
    const raw = localStorage.getItem(printKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
