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
  getCampusScope,
  setCampusScope as persistCampusScope,
  getActiveCampus,
  setActiveCampus as persistActiveCampus,
} from "./authStorage";
import {
  buildAccountOptions,
  isValidAccountSelection,
  normalizeCampusScopeForRoles,
  normalizeRoles,
  pickDefaultActiveAccount,
} from "../modules/dashboard/utils/accounts";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => getUser());
  const [roles, setRolesState] = useState(() => normalizeRoles(getUserRoles()));
  const [campusScope, setCampusScopeState] = useState(() =>
    normalizeCampusScopeForRoles({ roles: normalizeRoles(getUserRoles()), campusScope: getCampusScope() }),
  );

  const [activeRole, setActiveRoleState] = useState(() => getActiveRole());
  const [activeCampus, setActiveCampusState] = useState(() => getActiveCampus());

  const isAuthenticated = Boolean(token);

  const applyActiveSelection = useCallback(
    ({ role, campus }) => {
      const options = buildAccountOptions({ roles, campusScope });
      const next = { role, campus };

      if (!isValidAccountSelection(next, options)) {
        const fallback = pickDefaultActiveAccount({ roles, campusScope, preferred: next });
        setActiveRoleState(fallback.role);
        setActiveCampusState(fallback.campus);
        persistActiveRole(fallback.role || "");
        persistActiveCampus(fallback.campus || "");
        return fallback;
      }

      const safeRole = String(role || "").toUpperCase();
      const safeCampus = String(campus || "").toUpperCase();
      setActiveRoleState(safeRole);
      setActiveCampusState(safeCampus);
      persistActiveRole(safeRole || "");
      persistActiveCampus(safeCampus || "");
      return { role: safeRole, campus: safeCampus };
    },
    [roles, campusScope],
  );

  const setActiveAccount = useCallback(
    ({ role, campus }) => {
      return applyActiveSelection({ role, campus });
    },
    [applyActiveSelection],
  );

  /**
   * setSession:
   * Actualiza state + localStorage en una sola operación.
   * next: { token?, user?, roles?, campusScope?, activeRole?, activeCampus?, activeAccount? }
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

      const incomingRoles = "roles" in next ? normalizeRoles(next.roles) : roles;
      const rawCampusScope = "campusScope" in next ? next.campusScope : ("user" in next ? next.user?.campusScope : campusScope);
      const incomingCampusScope = normalizeCampusScopeForRoles({ roles: incomingRoles, campusScope: rawCampusScope });

      if ("roles" in next) {
        setUserRoles(incomingRoles);
        setRolesState(incomingRoles);
      }

      if ("campusScope" in next || "roles" in next || "user" in next) {
        persistCampusScope(incomingCampusScope);
        setCampusScopeState(incomingCampusScope);
      }

      if ("roles" in next || "campusScope" in next || "activeRole" in next || "activeCampus" in next || "activeAccount" in next || "user" in next) {
        const options = buildAccountOptions({ roles: incomingRoles, campusScope: incomingCampusScope });
        const preferred = next.activeAccount || {
          role: next.activeRole || getActiveRole(),
          campus: next.activeCampus || getActiveCampus(),
        };

        const computed = isValidAccountSelection(preferred, options)
          ? { role: String(preferred.role).toUpperCase(), campus: String(preferred.campus).toUpperCase() }
          : pickDefaultActiveAccount({ roles: incomingRoles, campusScope: incomingCampusScope, preferred });

        setActiveRoleState(computed.role);
        setActiveCampusState(computed.campus);
        persistActiveRole(computed.role || "");
        persistActiveCampus(computed.campus || "");
      }
    },
    [roles, campusScope],
  );

  const logout = useCallback(() => {
    clearSession();
    setTokenState(null);
    setUserState(null);
    setRolesState([]);
    setCampusScopeState([]);
    setActiveRoleState(null);
    setActiveCampusState(null);
  }, []);

  const accountOptions = useMemo(
    () => buildAccountOptions({ roles, campusScope }).map((option) => ({ ...option })),
    [roles, campusScope],
  );

  const value = useMemo(
    () => ({
      token,
      user,
      roles,
      campusScope,
      activeRole,
      activeCampus,
      accountOptions,
      isAuthenticated,
      setActiveAccount,
      setSession,
      logout,
    }),
    [token, user, roles, campusScope, activeRole, activeCampus, accountOptions, isAuthenticated, setActiveAccount, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
