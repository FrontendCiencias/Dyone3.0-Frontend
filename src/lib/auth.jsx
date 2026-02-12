// src/lib/auth.js
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import {
  getToken,
  setToken,
  getUser,
  setUser,
  getUserRoles,
  setUserRoles,
  getActiveRole,
  setActiveRole as persistActiveRole,
  clearSession,
} from "./authStorage";

const AuthContext = createContext(null);

function pickValidActiveRole(nextRoles, preferred) {
  const roles = Array.isArray(nextRoles) ? nextRoles : [];
  if (!roles.length) return null;

  const pref = preferred || null;
  if (pref && roles.includes(pref)) return pref;

  const stored = getActiveRole();
  if (stored && roles.includes(stored)) return stored;

  return roles[0] || null;
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => getUser());
  const [roles, setRolesState] = useState(() => getUserRoles());

  const [activeRole, setActiveRoleState] = useState(() => {
    const stored = getActiveRole();
    const storedRoles = getUserRoles();
    return stored && storedRoles.includes(stored) ? stored : storedRoles[0] || null;
  });

  const isAuthenticated = Boolean(token);

  const setActiveRole = useCallback(
    (role) => {
      const next = role || null;

      // Evita guardar un rol inválido que no exista en roles actuales
      if (next && Array.isArray(roles) && roles.length && !roles.includes(next)) return;

      setActiveRoleState(next);
      if (next) persistActiveRole(next);
      else persistActiveRole("");
    },
    [roles]
  );

  /**
   * setSession:
   * Actualiza state + localStorage en una sola operación.
   * next: { token?, user?, roles?, activeRole? }
   */
  const setSession = useCallback(
    (next = {}) => {
      if ("token" in next) {
        const t = next.token || null;
        if (t) setToken(t);
        else setToken("");
        setTokenState(t);
      }

      if ("user" in next) {
        const u = next.user || null;
        setUser(u);
        setUserState(u);
      }

      if ("roles" in next) {
        const r = Array.isArray(next.roles) ? next.roles : [];
        setUserRoles(r);
        setRolesState(r);

        const computedActive = pickValidActiveRole(r, next.activeRole);
        setActiveRoleState(computedActive);
        persistActiveRole(computedActive || "");
      } else if ("activeRole" in next) {
        // Solo cambiar activeRole si roles ya están cargados
        const computedActive = pickValidActiveRole(roles, next.activeRole);
        setActiveRoleState(computedActive);
        persistActiveRole(computedActive || "");
      }
    },
    [roles]
  );

  const logout = useCallback(() => {
    clearSession();
    setTokenState(null);
    setUserState(null);
    setRolesState([]);
    setActiveRoleState(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      roles,
      activeRole,
      isAuthenticated,
      setActiveRole,
      setSession, // ✅ nuevo
      logout,
    }),
    [token, user, roles, activeRole, isAuthenticated, setActiveRole, setSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
