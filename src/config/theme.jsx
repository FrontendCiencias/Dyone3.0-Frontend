import React, { createContext, useEffect, useMemo, useState } from "react";

export const THEMES = {
  ALL: {
    main: "#111827",
    dark: "#000000",
    softBg: "rgba(17,24,39,0.10)",
    gradientFrom: "#111827",
    gradientTo: "#000000",
  },
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
};

export const DEFAULT_CAMPUS = "CIENCIAS";

export function getThemeByCampusCode(campusCode) {
  const code = String(campusCode || "").toUpperCase();

  if (code === "ALL") return THEMES.ALL;
  if (code.includes("CIMAS")) return THEMES.CIMAS;
  if (code.includes("CIENCIAS_APLICADAS") || code.includes("CIENCIAS_PRIM")) return THEMES.CIENCIAS_APLICADAS;
  if (code.includes("CIENCIAS") || code.includes("CIENCIAS_SEC")) return THEMES.CIENCIAS;

  return THEMES.CIENCIAS;
}

function normalizeTheme(baseTheme) {
  const main = baseTheme?.main || THEMES.CIENCIAS.main;
  const dark = baseTheme?.dark || main;

  return {
    ...baseTheme,
    main,
    dark,
    primary: main,
    accent: dark,
    accentSoft: baseTheme?.softBg || THEMES.CIENCIAS.softBg,
    gradientFrom: baseTheme?.gradientFrom || main,
    gradientVia: baseTheme?.gradientVia || main,
    gradientTo: baseTheme?.gradientTo || dark,
  };
}

export const ThemeContext = createContext({
  theme: normalizeTheme(THEMES.CIENCIAS),
  campus: DEFAULT_CAMPUS,
  setCampus: () => {},
});

const STORAGE_KEY = "activeCampus";

export function ThemeProvider({ children, campus: controlledCampus }) {
  const [internalCampus, setInternalCampus] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_CAMPUS;
  });

  const campus = controlledCampus || internalCampus;

  const theme = useMemo(() => normalizeTheme(getThemeByCampusCode(campus)), [campus]);

  useEffect(() => {
    if (!controlledCampus) localStorage.setItem(STORAGE_KEY, internalCampus);
  }, [internalCampus, controlledCampus]);

  useEffect(() => {
    if (controlledCampus) localStorage.setItem(STORAGE_KEY, controlledCampus);
  }, [controlledCampus]);

  return (
    <ThemeContext.Provider value={{ theme, campus, setCampus: setInternalCampus }}>
      {children}
    </ThemeContext.Provider>
  );
}
