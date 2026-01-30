// src/modules/dashboard/config/roleTheme.js
import { getThemeByRole } from "../../../config/theme";

/**
 * Normaliza el theme para el dashboard
 * Retorna siempre: { main, dark, softBg }
 */
export function getRoleTheme(activeRole) {
  const t = getThemeByRole(activeRole);

  return {
    main: t.main,
    dark: t.dark,
    softBg: t.softBg,
  };
}
