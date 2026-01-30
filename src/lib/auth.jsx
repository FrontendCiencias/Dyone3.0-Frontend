// src/lib/auth.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getToken,
  getUser,
  getUserRoles,
  getActiveRole,
  setActiveRole as persistActiveRole,
  clearSession,
} from "./authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => getUser());
  const [roles, setRolesState] = useState(() => getUserRoles());

  const [activeRole, setActiveRoleState] = useState(() => {
    const stored = getActiveRole();
    const storedRoles = getUserRoles();
    return stored && storedRoles.includes(stored)
      ? stored
      : storedRoles[0] || null;
  });

  const isAuthenticated = Boolean(token);

  // sincroniza activeRole con localStorage
  const setActiveRole = (role) => {
    setActiveRoleState(role);
    persistActiveRole(role);
  };

  const logout = () => {
    clearSession();
    setTokenState(null);
    setUserState(null);
    setRolesState([]);
    setActiveRoleState(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      roles,
      activeRole,
      isAuthenticated,
      setActiveRole,
      logout,
    }),
    [token, user, roles, activeRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
