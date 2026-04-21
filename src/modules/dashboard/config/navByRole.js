import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  Sparkles,
  Settings2,
  Code2,
  GraduationCap,
  Users,
  School,
  BookOpenCheck,
  Landmark,
} from "lucide-react";

import { ROUTES } from "../../../config/routes";
import { CAPABILITIES, hasCapability } from "../../auth/utils/capabilities";

const NAV_ITEMS = [
  {
    to: ROUTES.dashboard,
    label: "Inicio",
    description: "Resumen general",
    icon: LayoutDashboard,
    capability: CAPABILITIES.dashboardView,
  },
  {
    to: ROUTES.dashboardStudents,
    label: "Alumnos",
    description: "Consulta y gestion de alumnos",
    descriptionByRole: {
      ADMIN: "Busqueda global",
      SECRETARY: "Ventanilla y ficha rapida",
      SECRETARY_VIEWER: "Consulta y expediente",
      DIRECTOR: "Consulta por campus",
      PROMOTER: "Busqueda global",
    },
    icon: GraduationCap,
    capability: CAPABILITIES.studentsView,
  },
  {
    to: ROUTES.dashboardEnrollments,
    label: "Matriculas",
    description: "Registrar y gestionar",
    icon: ClipboardList,
    capability: CAPABILITIES.enrollmentsView,
  },
  {
    to: ROUTES.dashboardPayments,
    label: "Pagos",
    description: "Cobros y pensiones",
    icon: CreditCard,
    capability: CAPABILITIES.paymentsView,
  },
  {
    to: ROUTES.dashboardActivities,
    label: "Actividades",
    description: "Concursos y recaudaciones especiales",
    icon: Sparkles,
    capability: CAPABILITIES.activitiesView,
  },
  {
    to: ROUTES.dashboardPrograms,
    label: "Programas",
    description: "Programas y pagos libres",
    icon: BookOpenCheck,
    capability: CAPABILITIES.adminView,
    roles: ["ADMIN"],
  },
  {
    to: ROUTES.dashboardAttendance,
    label: "Asistencia",
    description: "Preparar y tomar asistencia",
    icon: ClipboardList,
    capability: CAPABILITIES.attendanceView,
  },
  {
    to: ROUTES.dashboardAttendanceJustifications,
    label: "Justificaciones",
    description: "Tardanzas y faltas",
    icon: Users,
    capability: CAPABILITIES.attendanceView,
    roles: ["ADMIN", "AUXILIAR"],
  },
  {
    to: ROUTES.dashboardAttendanceReports,
    label: "Reportes",
    description: "Consulta y seguimiento",
    icon: GraduationCap,
    capability: CAPABILITIES.attendanceView,
    roles: ["ADMIN", "AUXILIAR"],
  },
  {
    to: ROUTES.dashboardClassrooms,
    label: "Salones",
    description: "Mover por seccion",
    icon: School,
    capability: CAPABILITIES.classroomsBoardView,
  },
  {
    to: ROUTES.dashboardAdminAccounting,
    label: "Admin · Contabilidad",
    description: "Listado global de pagos",
    icon: Landmark,
    capability: CAPABILITIES.adminView,
    roles: ["ADMIN"],
  },
  {
    to: ROUTES.dashboardAdminSettings,
    label: "Admin · Configuracion",
    description: "Configuracion sensible",
    icon: Settings2,
    capability: CAPABILITIES.adminView,
  },
  {
    to: ROUTES.dashboardAdminDev,
    label: "Admin · Desarrollo",
    description: "Endpoints y modelos",
    icon: Code2,
    capability: CAPABILITIES.adminDevView,
  },
];

export function getNavItemsByRole(activeRole) {
  const role = String(activeRole || "").toUpperCase();

  return NAV_ITEMS
    .filter((item) => hasCapability(role, item.capability))
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => ({
      to: item.to,
      label: item.label,
      icon: item.icon,
      description: item.descriptionByRole?.[role] || item.description,
    }));
}
