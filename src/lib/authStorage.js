// src/lib/authStorage.js
const TOKEN_KEY = "token";
const ROLES_KEY = "roles";
const CURRENT_ROLE_KEY = "activeRole";
const USER_KEY = "user";

export function getToken() {
  const t = localStorage.getItem(TOKEN_KEY);
  return t && t.trim() ? t : null;
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUserRoles() {
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setUserRoles(roles) {
  const safe = Array.isArray(roles) ? roles : [];
  localStorage.setItem(ROLES_KEY, JSON.stringify(safe));
}

export function clearUserRoles() {
  localStorage.removeItem(ROLES_KEY);
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export function getActiveRole() {
  const r = localStorage.getItem(CURRENT_ROLE_KEY);
  return r && r.trim() ? r : null;
}

export function setActiveRole(role) {
  if (!role) {
    localStorage.removeItem(CURRENT_ROLE_KEY);
    return;
  }
  localStorage.setItem(CURRENT_ROLE_KEY, role);
}

export function clearActiveRole() {
  localStorage.removeItem(CURRENT_ROLE_KEY);
}

export function clearSession() {
  clearToken();
  clearUserRoles();
  clearActiveRole();
  clearUser();
}
