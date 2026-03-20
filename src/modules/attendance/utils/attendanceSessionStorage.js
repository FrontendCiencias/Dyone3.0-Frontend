const STORAGE_KEY = "attendanceSessionByCampusDate";

function readMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function buildKey({ campus, date }) {
  return `${String(campus || "").toUpperCase()}::${String(date || "")}`;
}

export function getStoredAttendanceSessionId({ campus, date }) {
  const map = readMap();
  return map[buildKey({ campus, date })] || "";
}

export function setStoredAttendanceSessionId({ campus, date, sessionId }) {
  const map = readMap();
  map[buildKey({ campus, date })] = String(sessionId || "");
  writeMap(map);
}

export function clearStoredAttendanceSessionId({ campus, date }) {
  const map = readMap();
  delete map[buildKey({ campus, date })];
  writeMap(map);
}
