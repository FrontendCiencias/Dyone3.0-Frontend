import test from "node:test";
import assert from "node:assert/strict";
import {
  PRINT_TTL_MS, PRINT_LEASE_MS, PRINT_CLOSE_GRACE_MS,
  cleanupPrintStorage, createPrintStorageKey, savePrintPayload,
  resolvePrintPayload, startPrintPreviewLifecycle,
} from "../src/shared/utils/printStorage.mjs";

const NOW = 1792700000000;
const job = (age = 0, prefix = "student-print-cards", suffix = "abc123") => `${prefix}-${NOW - age}-${suffix}`;
const payload = { items: [{ name: "Alumno" }] };

class Storage {
  values = new Map();
  writes = 0;
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.writes += 1; this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

class Events {
  handlers = new Map();
  addEventListener(type, callback) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(callback);
  }
  removeEventListener(type, callback) { this.handlers.get(type)?.delete(callback); }
  dispatch(type, event = {}) { this.handlers.get(type)?.forEach((callback) => callback(event)); }
}

class Browser extends Events {
  document = Object.assign(new Events(), { visibilityState: "visible" });
  timers = new Set();
  setInterval(callback) { this.timers.add(callback); return callback; }
  clearInterval(callback) { this.timers.delete(callback); }
  tick() { this.timers.forEach((callback) => callback()); }
}

function fixture(key = job()) {
  const storage = new Storage();
  storage.setItem(key, JSON.stringify(payload));
  let current = NOW;
  const target = new Browser();
  const start = (owner = "tab1") => startPrintPreviewLifecycle(key, {
    storage, owner, target, now: () => current,
  });
  return { storage, key, target, start, setNow(value) { current = value; } };
}

test("cleans all legacy print prefixes, never authentication or lookalike keys", () => {
  const storage = new Storage();
  for (const prefix of ["payments-debtors-print", "payments-debtors-list", "payments-debtors-letters", "student-print-cards", "classroom-roster-print", "payments-caja-arequipa-print", "enrollment-contract-preview-v2"]) {
    storage.setItem(job(PRINT_TTL_MS + 1, prefix), JSON.stringify(payload));
  }
  const untouched = ["auth_token", "theme", "attendance-session", "student-print-cards-draft", `${job(PRINT_TTL_MS + 1)}-extra`, job()];
  untouched.forEach((key) => storage.setItem(key, "retained"));
  assert.equal(cleanupPrintStorage({ storage, now: NOW }), 7);
  untouched.forEach((key) => assert.equal(storage.getItem(key), "retained"));
});

test("save/read keep the existing payload shape and reject foreign keys", () => {
  const storage = new Storage();
  savePrintPayload(job(), payload, { storage, now: NOW });
  assert.deepEqual(resolvePrintPayload(job(), { storage, now: NOW }), payload);
  assert.equal(resolvePrintPayload(job(PRINT_TTL_MS + 1), { storage, now: NOW }), null);
  assert.throws(() => savePrintPayload("auth_token", payload, { storage }), /no permitida/);
  assert.throws(() => createPrintStorageKey("arbitrary"), /no permitido/);
  assert.match(createPrintStorageKey("student-print-cards"), /^student-print-cards-\d{13}-[a-z0-9]+$/);
});

test("lifecycle cannot lease or delete a foreign key supplied in a URL", () => {
  const storage = new Storage();
  const target = new Browser();
  storage.setItem("auth_token", "retained");
  const current = startPrintPreviewLifecycle("auth_token", { storage, target });
  current.dispose();
  current.close();
  assert.equal(storage.getItem("auth_token"), "retained");
  assert.equal(storage.length, 1);
  assert.equal(target.timers.size, 0);
});

test("full storage cleans legacy entries before writing", () => {
  const storage = new Storage();
  storage.setItem(job(PRINT_TTL_MS + 1), "old");
  const setItem = storage.setItem.bind(storage);
  storage.setItem = (key, value) => {
    if (storage.getItem(job(PRINT_TTL_MS + 1))) throw new DOMException("full", "QuotaExceededError");
    setItem(key, value);
  };
  savePrintPayload(job(), payload, { storage, now: NOW });
  assert.deepEqual(resolvePrintPayload(job(), { storage, now: NOW }), payload);
});

test("quota failure sweeps again and retries exactly once", () => {
  const storage = new Storage();
  let attempts = 0;
  storage.setItem = (key, value) => {
    attempts += 1;
    if (attempts === 1) {
      storage.values.set(job(PRINT_TTL_MS + 1), "old inserted during attempt");
      throw new DOMException("full", "QuotaExceededError");
    }
    assert.equal(storage.getItem(job(PRINT_TTL_MS + 1)), null);
    storage.values.set(key, value);
  };
  savePrintPayload(job(), payload, { storage, now: NOW });
  assert.equal(attempts, 2);
});

test("oversized batch reports actionable quota error after two attempts without evicting recent jobs", () => {
  const storage = new Storage();
  storage.setItem(job(1000), "recent");
  let attempts = 0;
  storage.setItem = () => { attempts += 1; throw new DOMException("full", "QuotaExceededError"); };
  assert.throws(() => savePrintPayload(job(), payload, { storage, now: NOW }), (error) => {
    assert.equal(error.code, "PRINT_STORAGE_QUOTA");
    assert.match(error.message, /menos alumnos o registros/);
    return true;
  });
  assert.equal(attempts, 2);
  assert.equal(storage.getItem(job(1000)), "recent");
});

test("unavailable storage is not retried or mislabeled as quota", () => {
  const storage = new Storage();
  let attempts = 0;
  storage.setItem = () => { attempts += 1; throw new DOMException("denied", "SecurityError"); };
  assert.throws(() => savePrintPayload(job(), payload, { storage, now: NOW }), { code: "PRINT_STORAGE_UNAVAILABLE" });
  assert.equal(attempts, 1);
});

test("corrupt JSON, missing keys, and storage read errors return null", () => {
  const storage = new Storage();
  storage.setItem(job(), "{invalid");
  assert.equal(resolvePrintPayload(job(), { storage, now: NOW }), null);
  assert.equal(resolvePrintPayload("", { storage, now: NOW }), null);
  storage.getItem = () => { throw new Error("denied"); };
  assert.equal(resolvePrintPayload(job(), { storage, now: NOW }), null);
  assert.doesNotThrow(() => cleanupPrintStorage({ storage, now: NOW }));
});

test("startup cleanup tolerates denied enumeration and removal", () => {
  const storage = new Storage();
  storage.setItem(job(PRINT_TTL_MS + 1), "old");
  storage.removeItem = () => { throw new Error("denied"); };
  assert.doesNotThrow(() => cleanupPrintStorage({ storage, now: NOW }));
  assert.equal(storage.length, 1);
  storage.key = () => { throw new Error("denied"); };
  assert.equal(cleanupPrintStorage({ storage, now: NOW }), 0);
});

test("active preview lease survives base TTL, heartbeat extends it, crashed lease expires", () => {
  const f = fixture(job(PRINT_TTL_MS - 1));
  f.start();
  assert.equal(cleanupPrintStorage({ storage: f.storage, now: NOW + 2 }), 0);
  f.setNow(NOW + PRINT_LEASE_MS - 1);
  f.target.tick();
  assert.equal(cleanupPrintStorage({ storage: f.storage, now: NOW + PRINT_LEASE_MS + 1 }), 0);
  assert.deepEqual(resolvePrintPayload(f.key, { storage: f.storage, now: NOW + PRINT_LEASE_MS + 1 }), payload);
  assert.equal(cleanupPrintStorage({ storage: f.storage, now: NOW + 2 * PRINT_LEASE_MS }), 1);
});

test("native close accelerates expiration but reload during grace renews the job", () => {
  const f = fixture();
  const first = f.start();
  f.target.dispatch("pagehide", { persisted: false });
  first.dispose();
  assert.equal(cleanupPrintStorage({ storage: f.storage, now: NOW + PRINT_CLOSE_GRACE_MS - 1 }), 0);
  f.setNow(NOW + PRINT_CLOSE_GRACE_MS - 1);
  const reloaded = f.start("new-document");
  assert.deepEqual(resolvePrintPayload(f.key, { storage: f.storage, now: NOW + PRINT_CLOSE_GRACE_MS + 1 }), payload);
  reloaded.dispose();
  assert.equal(cleanupPrintStorage({ storage: f.storage, now: NOW + 2 * PRINT_CLOSE_GRACE_MS }), 1);
});

test("BFCache pagehide retains full lease and pageshow renews it", () => {
  const f = fixture(job(PRINT_TTL_MS - 1));
  f.start();
  f.target.dispatch("pagehide", { persisted: true });
  assert.equal(cleanupPrintStorage({ storage: f.storage, now: NOW + PRINT_CLOSE_GRACE_MS + 1 }), 0);
  f.setNow(NOW + PRINT_LEASE_MS - 1);
  f.target.dispatch("pageshow");
  assert.equal(cleanupPrintStorage({ storage: f.storage, now: NOW + PRINT_LEASE_MS + 1 }), 0);
});

test("StrictMode setup/cleanup/setup never removes payload or leaks timers/listeners", () => {
  const f = fixture();
  f.start().dispose();
  const second = f.start();
  assert.equal(f.target.timers.size, 1);
  assert.equal(f.target.handlers.get("pagehide").size, 1);
  assert.deepEqual(resolvePrintPayload(f.key, { storage: f.storage, now: NOW }), payload);
  second.dispose();
  assert.equal(f.target.timers.size, 0);
  assert.equal(f.target.handlers.get("pagehide").size, 0);
});

test("closing one of two previews cannot remove the other preview's job", () => {
  const f = fixture();
  const first = f.start("first");
  const second = f.start("second");
  first.close();
  assert.deepEqual(resolvePrintPayload(f.key, { storage: f.storage, now: NOW }), payload);
  second.close();
  assert.equal(f.storage.getItem(f.key), null);
  assert.equal(f.storage.length, 0);
});

test("explicit Close deletes its job immediately; failed lease writes never break preview", () => {
  const f = fixture();
  const current = f.start();
  current.close();
  assert.equal(f.storage.getItem(f.key), null);
  const denied = fixture();
  denied.storage.setItem = () => { throw new DOMException("full", "QuotaExceededError"); };
  assert.doesNotThrow(() => denied.start().dispose());
  assert.equal(denied.storage.getItem(denied.key), JSON.stringify(payload));
});
