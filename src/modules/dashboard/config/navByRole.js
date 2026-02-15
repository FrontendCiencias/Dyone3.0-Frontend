// src/modules/dashboard/config/navByRole.js
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CreditCard,
  Settings,
  GraduationCap,
} from "lucide-react";

import { ROUTES } from "../../../config/routes";

const isAdmin = (r) => String(r || "").toUpperCase().startsWith("ADMIN");
const isSecretary = (r) => String(r || "").toUpperCase().startsWith("SECRETARY");
const isDirector = (r) => String(r || "").toUpperCase().startsWith("DIRECTOR");
const isPromoter = (r) => String(r || "").toUpperCase().startsWith("PROMOTER");

export function getNavItemsByRole(activeRole) {
  const role = String(activeRole || "").toUpperCase();

  const base = [
    {
      to: ROUTES.dashboard,
      label: "Inicio",
      description: "Resumen general",
      icon: LayoutDashboard,
    },
  ];

  if (isSecretary(role)) {
    return [
      ...base,
      {
        to: ROUTES.dashboardStudents,
        label: "Alumnos",
        description: "Ventanilla y ficha rápida",
        icon: GraduationCap,
      },
      {
        to: ROUTES.dashboardEnrollments,
        label: "Matrículas",
        description: "Registrar y gestionar",
        icon: ClipboardList,
      },
      {
        to: ROUTES.dashboardFamilies,
        label: "Familias",
        description: "Padres y tutores",
        icon: Users,
      },
      {
        to: ROUTES.dashboardPayments,
        label: "Pagos",
        description: "Cobros y pensiones",
        icon: CreditCard,
      },
    ];
  }

  if (isDirector(role)) {
    return [
      ...base,
      {
        to: ROUTES.dashboardStudents,
        label: "Alumnos",
        description: "Consulta por campus",
        icon: GraduationCap,
      },
      {
        to: ROUTES.dashboardPlaceholder,
        label: "Reportes",
        description: "Indicadores y seguimiento",
        icon: ClipboardList,
      },
    ];
  }

  if (isPromoter(role)) {
    return [
      ...base,
      {
        to: ROUTES.dashboardStudents,
        label: "Alumnos",
        description: "Búsqueda global",
        icon: GraduationCap,
      },
      {
        to: ROUTES.dashboardPlaceholder,
        label: "Prospectos",
        description: "Captación y pipeline",
        icon: Users,
      },
    ];
  }

  if (isAdmin(role)) {
    return [
      ...base,
      {
        to: ROUTES.dashboardStudents,
        label: "Alumnos",
        description: "Búsqueda global",
        icon: GraduationCap,
      },
      {
        to: ROUTES.dashboardPayments,
        label: "Pagos",
        description: "Cobros y pensiones",
        icon: CreditCard,
      },
      {
        to: ROUTES.dashboardAdmin,
        label: "Admin",
        description: "Configuración sensible",
        icon: Settings,
      },
    ];
  }

  return base;
}
