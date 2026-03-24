// src/modules/dashboard/config/navByRole.js
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  Settings2,
  Code2,
  GraduationCap,
  Users,
} from "lucide-react";

import { ROUTES } from "../../../config/routes";

const isAdmin = (r) => String(r || "").toUpperCase() === "ADMIN";
const isSecretary = (r) => ["SECRETARY", "SECRETARY_VIEWER"].includes(String(r || "").toUpperCase());
const isAuxiliar = (r) => String(r || "").toUpperCase() === "AUXILIAR";
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
        to: ROUTES.dashboardPayments,
        label: "Pagos",
        description: "Cobros y pensiones",
        icon: CreditCard,
      },
    ];
  }

  if (isAuxiliar(role)) {
    return [
      ...base,
      {
        to: ROUTES.dashboardAttendance,
        label: "Asistencia",
        description: "Preparar y tomar asistencia",
        icon: ClipboardList,
      },
      {
        to: ROUTES.dashboardAttendanceJustifications,
        label: "Justificaciones",
        description: "Tardanzas y faltas",
        icon: Users,
      },
      {
        to: ROUTES.dashboardAttendanceReports,
        label: "Reportes",
        description: "Consulta y seguimiento",
        icon: GraduationCap,
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
        icon: ClipboardList,
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
