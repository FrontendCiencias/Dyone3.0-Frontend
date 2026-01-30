// src/lib/authStorage.js

const TOKEN_KEY = "token";
const ROLES_KEY = "roles";
const CURRENT_ROLE_KEY = "activeRole";
const USER_KEY = "user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUserRoles() {
  try {
    return JSON.parse(localStorage.getItem(ROLES_KEY)) || [];
  } catch {
    return [];
  }
}

export function setUserRoles(roles) {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}

export function clearUserRoles() {
  localStorage.removeItem(ROLES_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export function getActiveRole() {
  return localStorage.getItem(CURRENT_ROLE_KEY);
}

export function setActiveRole(role) {
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
