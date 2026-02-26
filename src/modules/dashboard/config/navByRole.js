// src/modules/dashboard/config/navByRole.js
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CreditCard,
  Settings2,
  Code2,
  GraduationCap,
} from "lucide-react";

import { ROUTES } from "../../../config/routes";

const isAdmin = (r) => String(r || "").toUpperCase() === "ADMIN";
const isSecretary = (r) => ["SECRETARY", "SECRETARY_VIEWER", "AUXILIAR"].includes(String(r || "").toUpperCase());
const isDirector = (r) => String(r || "").toUpperCase() === "DIRECTOR";
const isPromoter = (r) => String(r || "").toUpperCase() === "PROMOTER";

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
        to: ROUTES.dashboardAdminSettings,
        label: "Admin · Configuración",
        description: "Configuración sensible",
        icon: Settings2,
      },
      {
        to: ROUTES.dashboardAdminDev,
        label: "Admin · Desarrollo",
        description: "Endpoints y modelos",
        icon: Code2,
      },
    ];
  }

  return base;
}
