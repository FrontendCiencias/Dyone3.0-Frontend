import React, { createContext, useEffect, useMemo, useState } from "react";

/**
 * Dyone 3.0 — Theme tokens
 * - main / dark: usados para gradientes y acentos
 * - softBg: fondo suave (active states)
 * - gradientFrom / gradientTo: por compatibilidad con tu código anterior
 */
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

  // ADMIN: requerido (negro)
  ADMIN: {
    main: "#111827", // slate-900
    dark: "#000000",
    softBg: "rgba(17,24,39,0.10)",
    gradientFrom: "#111827",
    gradientTo: "#000000",
  },
};

// Backward-compat con tu código anterior (themes.CIENCIAS_SEC, etc.)
export const themes = {
  CIMAS: {
    primary: THEMES.CIMAS.main,
    gradientFrom: THEMES.CIMAS.gradientFrom,
    gradientTo: THEMES.CIMAS.gradientTo,
  },

  // Alias antiguo: CIENCIAS_SEC -> CIENCIAS
  CIENCIAS_SEC: {
    primary: THEMES.CIENCIAS.main,
    gradientFrom: THEMES.CIENCIAS.gradientFrom,
    gradientTo: THEMES.CIENCIAS.gradientTo,
  },

  // Alias antiguo: CIENCIAS_PRIM -> CIENCIAS_APLICADAS (azul)
  CIENCIAS_PRIM: {
    primary: THEMES.CIENCIAS_APLICADAS.main,
    gradientFrom: THEMES.CIENCIAS_APLICADAS.gradientFrom,
    gradientTo: THEMES.CIENCIAS_APLICADAS.gradientTo,
  },
};

export const DEFAULT_ROLE = "SECRETARY_CIENCIAS";

/**
 * Devuelve el tema por rol.
 * Soporta variantes antiguas y nuevas.
 */
export function getThemeByRole(role) {
  const r = String(role || "").toUpperCase();

  if (!r) return THEMES.CIENCIAS;

  if (r.startsWith("ADMIN")) return THEMES.ADMIN;

  // CIMAS
  if (r.includes("CIMAS")) return THEMES.CIMAS;

  // CIENCIAS APLICADAS (azul)
  if (r.includes("CIENCIAS_APLICADAS") || r.includes("CIENCIAS_PRIM"))
    return THEMES.CIENCIAS_APLICADAS;

  // CIENCIAS (naranja) - default para ciencias
  if (r.includes("CIENCIAS") || r.includes("CIENCIAS_SEC"))
    return THEMES.CIENCIAS;

  return THEMES.CIENCIAS;
}

export const ThemeContext = createContext({
  theme: THEMES.CIENCIAS,
  role: DEFAULT_ROLE,
  setRole: () => {},
});

const STORAGE_KEY = "activeRole";

// export function ThemeProvider({ children }) {
//   const [role, setRole] = useState(() => {
//     return localStorage.getItem(STORAGE_KEY) || DEFAULT_ROLE;
//   });

//   const theme = useMemo(() => getThemeByRole(role), [role]);

//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEY, role);
//   }, [role]);

//   return (
//     <ThemeContext.Provider value={{ theme, role, setRole }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// }
