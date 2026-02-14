import React, { createContext, useEffect, useMemo, useState } from "react";

export const THEMES = {
  CIMAS: {
    main: "#E53E3E",
    dark: "#C53030",
    softBg: "rgba(229,62,62,0.10)",
    gradientFrom: "#F56565",
    gradientTo: "#C53030",
  },
  CIENCIAS: {
    main: "#DD6B20",
    dark: "#C05621",
    softBg: "rgba(221,107,32,0.10)",
    gradientFrom: "#F6AD55",
    gradientTo: "#C05621",
  },
  CIENCIAS_APLICADAS: {
    main: "#3182CE",
    dark: "#2B6CB0",
    softBg: "rgba(49,130,206,0.10)",
    gradientFrom: "#63B3ED",
    gradientTo: "#2B6CB0",
  },
  ADMIN: {
    main: "#111827",
    dark: "#000000",
    softBg: "rgba(17,24,39,0.10)",
    gradientFrom: "#111827",
    gradientTo: "#000000",
  },
};

export const DEFAULT_ROLE = "SECRETARY_CIENCIAS";

export function getThemeByRole(role) {
  const r = String(role || "").toUpperCase();

  if (!r) return THEMES.CIENCIAS;
  if (r.startsWith("ADMIN")) return THEMES.ADMIN;
  if (r.includes("CIMAS")) return THEMES.CIMAS;
  if (r.includes("CIENCIAS_APLICADAS") || r.includes("CIENCIAS_PRIM")) return THEMES.CIENCIAS_APLICADAS;
  if (r.includes("CIENCIAS") || r.includes("CIENCIAS_SEC")) return THEMES.CIENCIAS;

  return THEMES.CIENCIAS;
}

function normalizeTheme(baseTheme) {
  const main = baseTheme?.main || "#DD6B20";
  const dark = baseTheme?.dark || main;

  return {
    ...baseTheme,
    main,
    dark,
    primary: main,
    accent: dark,
    accentSoft: baseTheme?.softBg || "rgba(221,107,32,0.10)",
    gradientFrom: baseTheme?.gradientFrom || main,
    gradientVia: baseTheme?.gradientVia || main,
    gradientTo: baseTheme?.gradientTo || dark,
  };
}

export const ThemeContext = createContext({
  theme: normalizeTheme(THEMES.CIENCIAS),
  role: DEFAULT_ROLE,
  setRole: () => {},
});

const STORAGE_KEY = "activeRole";

export function ThemeProvider({ children, role: controlledRole }) {
  const [internalRole, setInternalRole] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_ROLE;
  });

  const role = controlledRole || internalRole;

  const theme = useMemo(() => normalizeTheme(getThemeByRole(role)), [role]);

  useEffect(() => {
    if (!controlledRole) localStorage.setItem(STORAGE_KEY, internalRole);
  }, [internalRole, controlledRole]);

  useEffect(() => {
    if (controlledRole) localStorage.setItem(STORAGE_KEY, controlledRole);
  }, [controlledRole]);

  return (
    <ThemeContext.Provider value={{ theme, role, setRole: setInternalRole }}>
      {children}
    </ThemeContext.Provider>
  );
}
