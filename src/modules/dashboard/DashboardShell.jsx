import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Topbar, { DASHBOARD_TOPBAR_HEIGHT } from "./components/Topbar";
import Sidebar, { SIDEBAR_WIDTHS } from "./components/Sidebar";
import BreadcrumbHeader from "./components/BreadcrumbHeader";
import PoweredBy from "./components/PoweredBy";
import { getNavItemsByRole } from "./config/navByRole";
import { useAuth } from "../../lib/auth";
import { ROUTES } from "../../config/routes";
import { useStudentSummaryQuery } from "../students/hooks/useStudentSummaryQuery";

const PAGE_META = {
  dashboard: { title: "Inicio Operativo", description: "Resumen operativo y alertas clave del dia." },
  attendance: { title: "Preparar sesion", description: "Configura la jornada de hoy o continua con una ya preparada." },
  attendanceIntake: { title: "Preparar sesion", description: "Configura la jornada de hoy o continua con una ya preparada." },
  attendanceTake: { title: "Toma operativa", description: "Registra codigos en ingreso y monitorea ultimos marcados." },
  attendanceJustifications: { title: "Justificaciones", description: "Gestiona tardanzas y faltas justificadas." },
  attendanceReports: { title: "Reportes de asistencia", description: "Consulta resumenes por alumno y salon." },
  students: { title: "Alumnos", description: "Busca, filtra y gestiona expedientes estudiantiles." },
  classrooms: { title: "Salones", description: "Reubica alumnos por grado y seccion." },
  studentDetail: { title: "Expediente del alumno", description: "Consulta identidad, matricula, aula y finanzas." },
  enrollmentDetail: { title: "Detalle de matrícula", description: "Revisa el estado, alumnos firmantes y contrato de la matrícula." },
  paymentDetail: { title: "Detalle de pagos", description: "Revisa deuda, pagos y registro de cobros por alumno." },
  paymentsDailyCash: { title: "Caja del día", description: "Consulta ingresos del día y revisa movimientos recientes por fecha." },
  activities: { title: "Activities", description: "Concursos, eventos y recaudaciones especiales fuera de caja diaria." },
  activityDetail: { title: "Detalle de activity", description: "Participantes, cobros y control operativo por cobrador." },
  adminSettings: { title: "Configuracion", description: "Sedes, ciclos, aulas y conceptos." },
  adminDev: { title: "Desarrollo", description: "Endpoints, modelos y utilidades tecnicas." },
  enrollments: { title: "Matriculas", description: "Monitorea y registra el flujo de matriculas." },
  enrollmentNew: { title: "Nueva Matricula", description: "Monitorea y registra el flujo de matriculas." },
  payments: { title: "Pagos", description: "Controla cobros, vencimientos y estado de pagos." },
  notFound: { title: "Pagina no encontrada", description: "La ruta no existe en el panel." },
};

function resolvePageKey(pathname) {
  if (pathname === ROUTES.dashboard) return "dashboard";
  if (pathname === ROUTES.dashboardAttendance) return "attendance";
  if (pathname === ROUTES.dashboardAttendanceIntake) return "attendanceIntake";
  if (/^\/dashboard\/attendance\/intake\/[^/]+$/.test(pathname)) return "attendanceTake";
  if (pathname === ROUTES.dashboardAttendanceJustifications) return "attendanceJustifications";
  if (pathname === ROUTES.dashboardAttendanceReports) return "attendanceReports";
  if (pathname.startsWith(ROUTES.dashboardAttendance)) return "attendance";
  if (pathname === ROUTES.dashboardClassrooms) return "classrooms";
  if (pathname === ROUTES.dashboardPaymentsDailyCash) return "paymentsDailyCash";
  if (pathname === ROUTES.dashboardActivities) return "activities";
  if (/^\/dashboard\/activities\/[^/]+$/.test(pathname)) return "activityDetail";
  if (/^\/dashboard\/students\/[^/]+$/.test(pathname)) return "studentDetail";
  if (/^\/dashboard\/enrollments\/[^/]+$/.test(pathname) && pathname !== ROUTES.dashboardEnrollmentNew) return "enrollmentDetail";
  if (/^\/dashboard\/payments\/[^/]+$/.test(pathname)) return "paymentDetail";
  if (pathname.startsWith(ROUTES.dashboardStudents)) return "students";
  if (pathname.startsWith(ROUTES.dashboardAdminDev)) return "adminDev";
  if (pathname.startsWith(ROUTES.dashboardAdminSettings) || pathname === ROUTES.dashboardAdmin) return "adminSettings";
  if (pathname === ROUTES.dashboardEnrollmentNew) return "enrollmentNew";
  if (pathname.startsWith(ROUTES.dashboardEnrollments)) return "enrollments";
  if (pathname.startsWith(ROUTES.dashboardPayments)) return "payments";
  if (pathname.startsWith("/dashboard/")) return "notFound";
  return "dashboard";
}

function getStudentBreadcrumbLabel(summary) {
  const student = summary?.student || {};
  const full = [student?.lastNames, student?.names].filter(Boolean).join(", ").trim();
  if (full) return full;
  return student?.internalCode || student?.code || "Alumno...";
}

function getDashboardRoleLabel(activeRole) {
  const normalized = String(activeRole || "").trim().toUpperCase();
  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "SECRETARY") return "SECRETARÍA";
  if (normalized === "AUXILIAR") return "AUXILIAR";
  if (normalized === "DIRECTOR") return "DIRECTOR";
  if (normalized === "PROMOTER") return "PROMOTER";
  return "INICIO";
}

export default function DashboardShell() {
  const { accountOptions, activeRole, activeCampus, setActiveAccount, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [expanded, setExpanded] = useState(false);

  const navItems = useMemo(() => getNavItemsByRole(activeRole), [activeRole]);

  const activeItemTo = useMemo(() => {
    const { pathname } = location;
    let best = null;

    for (const item of navItems) {
      const to = item.to;
      const exact = pathname === to;
      const prefix = pathname.startsWith(`${to}/`);

      if (exact || prefix) {
        if (!best || to.length > best.to.length) best = item;
      }
    }
    return best?.to ?? null;
  }, [location.pathname, navItems]);

  const pageKey = useMemo(() => resolvePageKey(location.pathname || ""), [location.pathname]);
  const studentId = useMemo(() => {
    const match = (location.pathname || "").match(/^\/dashboard\/(?:students|payments)\/([^/]+)$/);
    return match?.[1] || null;
  }, [location.pathname]);
  const deletedStudentId = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem("dyone.deletedStudentId");
  }, [location.pathname]);

  const studentSummaryQuery = useStudentSummaryQuery(
    studentId,
    (pageKey === "studentDetail" || pageKey === "paymentDetail") && studentId !== deletedStudentId,
  );

  const pageMeta = useMemo(() => {
    if (pageKey !== "studentDetail" && pageKey !== "paymentDetail") {
      return PAGE_META[pageKey] || PAGE_META.dashboard;
    }

    const label = studentSummaryQuery.isLoading
      ? "Alumno..."
      : getStudentBreadcrumbLabel(studentSummaryQuery.data);

    return {
      title: pageKey === "paymentDetail" ? `Detalle de pagos: ${label}` : `Expediente: ${label}`,
      description: pageKey === "paymentDetail" ? PAGE_META.paymentDetail.description : PAGE_META.studentDetail.description,
    };
  }, [pageKey, studentSummaryQuery.isLoading, studentSummaryQuery.data]);

  const breadcrumbItems = useMemo(() => {
    const rootCrumb = { label: getDashboardRoleLabel(activeRole), to: ROUTES.dashboard };

    if (pageKey === "dashboard") {
      return [{ label: getDashboardRoleLabel(activeRole) }];
    }

    if (pageKey === "adminSettings") {
      return [
        rootCrumb,
        { label: "Admin", to: ROUTES.dashboardAdminSettings },
        { label: "Configuracion" },
      ];
    }

    if (pageKey === "adminDev") {
      return [
        rootCrumb,
        { label: "Admin", to: ROUTES.dashboardAdminSettings },
        { label: "Desarrollo" },
      ];
    }

    if (pageKey === "enrollmentNew") {
      return [
        rootCrumb,
        { label: "Matriculas", to: ROUTES.dashboardEnrollments },
        { label: "Nueva Matricula" },
      ];
    }

    if (pageKey === "enrollmentDetail") {
      return [
        rootCrumb,
        { label: "Matriculas", to: ROUTES.dashboardEnrollments },
        { label: "Detalle de matrícula" },
      ];
    }

    if (pageKey === "attendanceIntake") {
      return [
        rootCrumb,
        { label: "Asistencia", to: ROUTES.dashboardAttendance },
        { label: "Preparar sesion" },
      ];
    }

    if (pageKey === "attendanceTake") {
      return [
        rootCrumb,
        { label: "Asistencia", to: ROUTES.dashboardAttendance },
        { label: "Preparar sesion", to: ROUTES.dashboardAttendanceIntake },
        { label: "Toma operativa" },
      ];
    }

    if (pageKey === "attendanceJustifications") {
      return [
        rootCrumb,
        { label: "Asistencia", to: ROUTES.dashboardAttendance },
        { label: "Justificaciones" },
      ];
    }

    if (pageKey === "attendanceReports") {
      return [
        rootCrumb,
        { label: "Asistencia", to: ROUTES.dashboardAttendance },
        { label: "Reportes" },
      ];
    }

    if (pageKey === "paymentsDailyCash") {
      return [
        rootCrumb,
        { label: "Pagos", to: ROUTES.dashboardPayments },
        { label: "Caja del día" },
      ];
    }

    if (pageKey === "activities") {
      return [
        rootCrumb,
        { label: "Activities" },
      ];
    }

    if (pageKey === "activityDetail") {
      return [
        rootCrumb,
        { label: "Activities", to: ROUTES.dashboardActivities },
        { label: "Detalle de activity" },
      ];
    }

    if (pageKey !== "studentDetail" && pageKey !== "paymentDetail") return null;

    const label = studentSummaryQuery.isLoading
      ? "Alumno..."
      : getStudentBreadcrumbLabel(studentSummaryQuery.data);

    if (pageKey === "paymentDetail") {
      return [
        rootCrumb,
        { label: "Pagos", to: ROUTES.dashboardPayments },
        { label: "Detalle de Pagos" },
      ];
    }

    return [
      rootCrumb,
      { label: "Alumnos", to: ROUTES.dashboardStudents },
      { label },
    ];
  }, [pageKey, studentSummaryQuery.isLoading, studentSummaryQuery.data, activeRole]);

  const leftPad = expanded ? SIDEBAR_WIDTHS.expanded : SIDEBAR_WIDTHS.collapsed;

  const activeAccount = useMemo(() => ({ role: activeRole, campus: activeCampus }), [activeRole, activeCampus]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <Sidebar
        navItems={navItems}
        activeItemTo={activeItemTo}
        activeCampus={activeCampus}
        onLogout={logout}
        onExpandChange={setExpanded}
      />

      <Topbar
        accountOptions={accountOptions}
        activeAccount={activeAccount}
        onAccountChange={(account) => {
          setActiveAccount?.(account);
          navigate(ROUTES.dashboard, { replace: true });
          queryClient.invalidateQueries({ queryKey: ["students"] });
          queryClient.invalidateQueries({ queryKey: ["families"] });
          queryClient.invalidateQueries({ queryKey: ["enrollments"] });
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["activities"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["attendance"] });
        }}
        offsetLeft={leftPad}
      />

      <main
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden transition-[padding-left] duration-300 ease-out"
        style={{ paddingLeft: leftPad }}
      >
        <div
          className="flex h-full min-h-0 flex-col gap-4 overflow-hidden px-4 pb-1 pt-0 md:px-6"
          style={{ paddingTop: DASHBOARD_TOPBAR_HEIGHT + 8 }}
        >
          <BreadcrumbHeader
            activeCampus={activeCampus}
            title={pageMeta.title}
            description={pageMeta.description}
            breadcrumbItems={breadcrumbItems}
          />

          <section className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="h-full min-h-0 overflow-y-auto p-4 md:p-5">
              <Outlet />
            </div>
          </section>
        </div>
      </main>

      <PoweredBy />
    </div>
  );
}
