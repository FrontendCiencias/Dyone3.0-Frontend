// src/modules/dashboard/config/roleTheme.js
import { getThemeByCampusCode } from "../../../config/theme";

/**
 * Normaliza el theme para el dashboard
 * Retorna siempre: { main, dark, softBg }
 */
export function getRoleTheme(activeCampus) {
  const t = getThemeByCampusCode(activeCampus);

  return {
    main: t.main,
    dark: t.dark,
    softBg: t.softBg,
  };
}
