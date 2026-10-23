// The timestamp in existing keys is also the creation date: no payload migration
// (or large extra write on already-full browsers) is needed.
export const PRINT_TTL_MS = 2 * 60 * 60 * 1000;
export const PRINT_LEASE_MS = 30 * 60 * 1000;
export const PRINT_HEARTBEAT_MS = 60 * 1000;
export const PRINT_CLOSE_GRACE_MS = 60 * 1000;

const JOB_PATTERN = /^(payments-debtors-(?:print|list|letters)|payments-caja-arequipa-print|student-print-cards|classroom-roster-print|enrollment-contract-preview-v2)-(\d{13})-([a-z0-9]{1,16})$/;
const LEASE_PREFIX = "__print-preview-lease__:";

function creationTime(key) {
  const match = JOB_PATTERN.exec(key || "");
  return match ? Number(match[2]) : null;
}

function leaseJob(key) {
  if (!key.startsWith(LEASE_PREFIX)) return null;
  const job = key.slice(LEASE_PREFIX.length, key.lastIndexOf(":"));
  return creationTime(job) !== null ? job : null;
}

function browserStorage() {
  return window.localStorage;
}

function keysOf(storage) {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean);
}

function leasesFor(storage, job, keys) {
  return keys.filter((key) => leaseJob(key) === job).map((key) => {
    try {
      const value = JSON.parse(storage.getItem(key));
      return { key, expiresAt: Number(value?.expiresAt) || 0, released: value?.released === true };
    } catch {
      return { key, expiresAt: 0, released: false };
    }
  });
}

function isExpired(job, leases, now) {
  if (leases.some((lease) => lease.expiresAt > now)) return false;
  // A normal departure gets a short grace period so reloading still works.
  return leases.some((lease) => lease.released) || creationTime(job) + PRINT_TTL_MS <= now;
}

function remove(storage, key) {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function createPrintStorageKey(prefix) {
  const key = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8) || "0"}`;
  if (creationTime(key) === null) throw new Error("Tipo de impresión no permitido.");
  return key;
}

// Best-effort maintenance must never prevent application startup. Only exact,
// owned print keys are eligible; authentication and preferences are untouched.
export function cleanupPrintStorage({ storage, now = Date.now() } = {}) {
  try {
    storage ||= browserStorage();
    const keys = keysOf(storage);
    let removed = 0;
    for (const key of keys) {
      if (creationTime(key) === null) continue;
      const leases = leasesFor(storage, key, keys);
      if (!isExpired(key, leases, now)) continue;
      if (remove(storage, key)) removed += 1;
    }
    for (const key of keys) {
      const job = leaseJob(key);
      if (!job) continue;
      const lease = leasesFor(storage, job, [key])[0];
      if (!storage.getItem(job) || lease.expiresAt <= now) remove(storage, key);
    }
    return removed;
  } catch {
    return 0;
  }
}

export function isQuotaExceeded(error) {
  return error?.name === "QuotaExceededError" || error?.name === "NS_ERROR_DOM_QUOTA_REACHED";
}

function storageError(error) {
  const quota = isQuotaExceeded(error);
  const wrapped = new Error(quota
    ? "No hay espacio suficiente en el navegador para preparar la impresión. Cierra vistas de impresión que ya no necesites e intenta con menos alumnos o registros."
    : "No se pudo guardar la impresión en este navegador. Revisa que el almacenamiento del sitio esté permitido e inténtalo nuevamente.");
  wrapped.name = "PrintStorageError";
  wrapped.code = quota ? "PRINT_STORAGE_QUOTA" : "PRINT_STORAGE_UNAVAILABLE";
  wrapped.cause = error;
  return wrapped;
}

export function savePrintPayload(key, payload, { storage, now = Date.now() } = {}) {
  if (creationTime(key) === null) throw new Error("Clave de impresión no permitida.");
  // Serialize once; retrying cannot fix a serialization/programming error.
  const serialized = JSON.stringify(payload);
  try {
    storage ||= browserStorage();
    cleanupPrintStorage({ storage, now });
    try {
      storage.setItem(key, serialized);
    } catch (error) {
      if (!isQuotaExceeded(error)) throw error;
      cleanupPrintStorage({ storage, now });
      storage.setItem(key, serialized); // Exactly one retry, and only for quota.
    }
  } catch (error) {
    throw storageError(error);
  }
}

export function resolvePrintPayload(key, { storage, now = Date.now() } = {}) {
  if (creationTime(key) === null) return null;
  try {
    storage ||= browserStorage();
    const leases = leasesFor(storage, key, keysOf(storage));
    if (isExpired(key, leases, now)) return null;
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// One small lease per preview prevents another tab's sweep from removing an
// active job. A crashed/suspended preview eventually loses its lease instead of
// retaining personal data forever. No payload is rewritten by heartbeats.
export function startPrintPreviewLifecycle(key, {
  storage,
  owner = Math.random().toString(36).slice(2) || "0",
  target = window,
  now = Date.now,
} = {}) {
  if (creationTime(key) === null) return { dispose() {}, close() {} };
  let timer;
  let disposed = false;
  const leaseKey = `${LEASE_PREFIX}${key}:${owner}`;
  const writeLease = (released) => {
    try {
      storage ||= browserStorage();
      if (!storage.getItem(key)) return;
      storage.setItem(leaseKey, JSON.stringify({
        expiresAt: now() + (released ? PRINT_CLOSE_GRACE_MS : PRINT_LEASE_MS),
        released,
      }));
    } catch {
      // A preview already loaded in memory remains usable if storage is denied.
    }
  };
  const renew = () => { if (!disposed) writeLease(false); };
  const release = () => writeLease(true);
  const onPageHide = (event) => { if (!event.persisted) release(); };
  const onVisible = () => { if (target.document.visibilityState === "visible") renew(); };
  renew();
  timer = target.setInterval(renew, PRINT_HEARTBEAT_MS);
  target.addEventListener("pagehide", onPageHide);
  target.addEventListener("pageshow", renew);
  target.document.addEventListener("visibilitychange", onVisible);
  const dispose = () => {
    disposed = true;
    target.clearInterval(timer);
    target.removeEventListener("pagehide", onPageHide);
    target.removeEventListener("pageshow", renew);
    target.document.removeEventListener("visibilitychange", onVisible);
    // Not a destructive effect cleanup: React StrictMode immediately renews
    // the same owner's lease, and reload/navigation has a one-minute grace.
    release();
  };
  return {
    dispose,
    close() {
      dispose();
      try {
        remove(storage, leaseKey);
        const otherLeases = leasesFor(storage, key, keysOf(storage));
        if (!otherLeases.some((lease) => lease.expiresAt > now())) remove(storage, key);
      } catch { /* Expiry and the next sweep remain the fallback. */ }
    },
  };
}
