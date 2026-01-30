// src/modules/dashboard/config/navByRole.js
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CreditCard,
  Settings,
} from "lucide-react";

const isAdmin = (r) => String(r || "").toUpperCase().startsWith("ADMIN");
const isSecretary = (r) => String(r || "").toUpperCase().startsWith("SECRETARY");
const isDirector = (r) => String(r || "").toUpperCase().startsWith("DIRECTOR");
const isPromoter = (r) => String(r || "").toUpperCase().startsWith("PROMOTER");

export function getNavItemsByRole(activeRole) {
  const role = String(activeRole || "").toUpperCase();

  const base = [
    { to: "/dashboard", label: "Inicio", description: "Resumen general", icon: LayoutDashboard },
  ];

  if (isSecretary(role)) {
    return [
      ...base,
      { to: "/dashboard/enrollments", label: "Matrículas", description: "Registrar y gestionar", icon: ClipboardList },
      { to: "/dashboard/families", label: "Familias", description: "Padres y tutores", icon: Users },
      { to: "/dashboard/payments", label: "Pagos", description: "Cobros y pensiones", icon: CreditCard },
    ];
  }

  if (isDirector(role)) {
    return [
      ...base,
      { to: "/dashboard/placeholder", label: "Reportes", description: "Indicadores y seguimiento", icon: ClipboardList },
    ];
  }

  if (isPromoter(role)) {
    return [
      ...base,
      { to: "/dashboard/placeholder", label: "Prospectos", description: "Captación y pipeline", icon: Users },
    ];
  }

  if (isAdmin(role)) {
    return [
      ...base,
      { to: "/dashboard/admin", label: "Admin", description: "Configuración del sistema", icon: Settings },
    ];
  }

  return base;
}
