import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Topbar, { DASHBOARD_TOPBAR_HEIGHT } from "./components/Topbar";
import Sidebar, { MobileSidebarOverlay, SIDEBAR_WIDTHS } from "./components/Sidebar";
import BreadcrumbHeader from "./components/BreadcrumbHeader";
import PoweredBy from "./components/PoweredBy";
import { getNavItemsByRole } from "./config/navByRole";
import { useAuth } from "../../lib/auth";
import { ROUTES } from "../../config/routes";
import { useStudentSummaryQuery } from "../students/hooks/useStudentSummaryQuery";
import { useActivityDetailQuery } from "../activities/hooks/useActivityDetailQuery";

const PAGE_META = {
  dashboard: { title: "Inicio Operativo", description: "Resumen operativo y alertas clave del dia." },
  attendance: { title: "Preparar sesion", description: "Configura la jornada de hoy o continua con una ya preparada." },
  attendanceIntake: { title: "Preparar sesion", description: "Configura la jornada de hoy o continua con una ya preparada." },
  attendanceTake: { title: "Toma operativa", description: "Registra codigos en ingreso y monitorea ultimos marcados." },
  attendanceJustifications: { title: "Justificaciones", description: "Gestiona tardanzas y faltas justificadas." },
  attendanceReports: { title: "Reportes de asistencia", description: "Consulta resumenes por alumno y salon." },
  students: { title: "Alumnos", description: "Busca, filtra y gestiona expedientes estudiantiles." },
  classrooms: { title: "Salones", description: "Consulta la distribucion de alumnos por grado y seccion." },
  studentDetail: { title: "Expediente del alumno", description: "Consulta identidad, matricula, aula y finanzas." },
  enrollmentDetail: { title: "Detalle de matrícula", description: "Revisa el estado, alumnos firmantes y contrato de la matrícula." },
  paymentDetail: { title: "Detalle de pagos", description: "Revisa deuda, pagos y registro de cobros por alumno." },
  paymentsCajaArequipa: { title: "Caja Arequipa", description: "Sube PDFs bancarios, revisa coincidencias y confirma importaciones de pensiones." },
  paymentsDailyCash: { title: "Caja del día", description: "Consulta ingresos del día y revisa movimientos recientes por fecha." },
  paymentsDebtorsPrint: { title: "Imprimir lista de deudores", description: "Filtra alumnos con deuda, selecciona destinatarios e imprime lista o comunicados." },
  activities: { title: "Actividades", description: "Concursos, eventos y recaudaciones especiales fuera de caja diaria." },
  activityDetail: { title: "Detalle de actividad", description: "Participantes, cobros y control operativo por cobrador." },
  activityPaidList: { title: "Lista de pagados", description: "Tabla consolidada de estudiantes pagados en la actividad." },
  adminAccounting: { title: "Contabilidad", description: "Consulta global de pagos, métodos y trazabilidad bancaria." },
  adminSettings: { title: "Configuracion", description: "Sedes, ciclos, aulas y conceptos." },
  adminDev: { title: "Desarrollo", description: "Endpoints, modelos y utilidades tecnicas." },
  enrollments: { title: "Matriculas", description: "Monitorea y registra el flujo de matriculas." },
  enrollmentNew: { title: "Nueva Matricula", description: "Monitorea y registra el flujo de matriculas." },
  programs: { title: "Programas", description: "Gestiona programas temporales y sus pagos independientes." },
  programDetail: { title: "Detalle de programa", description: "Opera sesiones, asistencia del día y pagos del programa." },
  programSessionDetail: { title: "Detalle de sesión", description: "Registra asistencia, pagos y receptor del cobro en la sesión." },
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
  if (pathname === ROUTES.dashboardPaymentsCajaArequipa) return "paymentsCajaArequipa";
  if (pathname === ROUTES.dashboardPaymentsDailyCash) return "paymentsDailyCash";
  if (pathname === ROUTES.dashboardPaymentsDebtorsPrint) return "paymentsDebtorsPrint";
  if (pathname === ROUTES.dashboardAdminAccounting) return "adminAccounting";
  if (pathname === ROUTES.dashboardActivities) return "activities";
  if (/^\/dashboard\/activities\/[^/]+\/lista$/.test(pathname)) return "activityPaidList";
  if (/^\/dashboard\/activities\/[^/]+$/.test(pathname)) return "activityDetail";
  if (/^\/dashboard\/students\/[^/]+$/.test(pathname)) return "studentDetail";
  if (/^\/dashboard\/enrollments\/[^/]+$/.test(pathname) && pathname !== ROUTES.dashboardEnrollmentNew) return "enrollmentDetail";
  if (/^\/dashboard\/programs\/[^/]+\/sessions\/[^/]+$/.test(pathname)) return "programSessionDetail";
  if (/^\/dashboard\/programs\/[^/]+$/.test(pathname)) return "programDetail";
  if (/^\/dashboard\/payments\/[^/]+$/.test(pathname)) return "paymentDetail";
  if (pathname.startsWith(ROUTES.dashboardStudents)) return "students";
  if (pathname.startsWith(ROUTES.dashboardAdminDev)) return "adminDev";
  if (pathname.startsWith(ROUTES.dashboardAdminSettings) || pathname === ROUTES.dashboardAdmin) return "adminSettings";
  if (pathname === ROUTES.dashboardEnrollmentNew) return "enrollmentNew";
  if (pathname === ROUTES.dashboardPrograms) return "programs";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateDesktop = (event) => {
      setIsDesktop(event.matches);
      if (event.matches) setMobileNavOpen(false);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateDesktop);
    return () => mediaQuery.removeEventListener("change", updateDesktop);
  }, []);

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
  const activityDetailId = useMemo(() => {
    const match = (location.pathname || "").match(/^\/dashboard\/activities\/([^/]+)(?:\/lista)?$/);
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
  const activityDetailQuery = useActivityDetailQuery(activityDetailId, pageKey === "activityDetail");

  const pageMeta = useMemo(() => {
    if (pageKey !== "studentDetail" && pageKey !== "paymentDetail" && pageKey !== "activityDetail" && pageKey !== "activityPaidList") {
      return PAGE_META[pageKey] || PAGE_META.dashboard;
    }

    if (pageKey === "activityDetail" || pageKey === "activityPaidList") {
      const activityName = activityDetailQuery.isLoading
        ? "Cargando..."
        : activityDetailQuery.data?.activity?.name || "Actividad";

      return {
        title: pageKey === "activityPaidList" ? `Lista de pagados: ${activityName}` : `Actividad: ${activityName}`,
        description: pageKey === "activityPaidList" ? PAGE_META.activityPaidList.description : PAGE_META.activityDetail.description,
      };
    }

    const label = studentSummaryQuery.isLoading
      ? "Alumno..."
      : getStudentBreadcrumbLabel(studentSummaryQuery.data);

    return {
      title: pageKey === "paymentDetail" ? `Detalle de pagos: ${label}` : `Expediente: ${label}`,
      description: pageKey === "paymentDetail" ? PAGE_META.paymentDetail.description : PAGE_META.studentDetail.description,
    };
  }, [pageKey, studentSummaryQuery.isLoading, studentSummaryQuery.data, activityDetailQuery.isLoading, activityDetailQuery.data]);

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

    if (pageKey === "adminAccounting") {
      return [
        rootCrumb,
        { label: "Admin", to: ROUTES.dashboardAdminAccounting },
        { label: "Contabilidad" },
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

    if (pageKey === "programs") {
      return [
        { label: "Inicio", to: ROUTES.dashboard },
        { label: "Programas" },
      ];
    }

    if (pageKey === "programDetail") {
      return [
        { label: "Inicio", to: ROUTES.dashboard },
        { label: "Programas", to: ROUTES.dashboardPrograms },
        { label: "Detalle del programa" },
      ];
    }

    if (pageKey === "programSessionDetail") {
      return [
        { label: "Inicio", to: ROUTES.dashboard },
        { label: "Programas", to: ROUTES.dashboardPrograms },
        { label: "Detalle del programa", to: ROUTES.dashboardProgramDetail(location.pathname.split("/")[3]) },
        { label: "Detalle de sesión" },
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

    if (pageKey === "paymentsCajaArequipa") {
      return [
        rootCrumb,
        { label: "Pagos", to: ROUTES.dashboardPayments },
        { label: "Caja Arequipa" },
      ];
    }

    if (pageKey === "paymentsDebtorsPrint") {
      return [
        rootCrumb,
        { label: "Pagos", to: ROUTES.dashboardPayments },
        { label: "Imprimir lista de deudores" },
      ];
    }

    if (pageKey === "activities") {
      return [
        rootCrumb,
        { label: "Actividades" },
      ];
    }

    if (pageKey === "students") {
      return [
        rootCrumb,
        { label: "Alumnos" },
      ];
    }

    if (pageKey === "activityDetail") {
      return [
        rootCrumb,
        { label: "Actividades", to: ROUTES.dashboardActivities },
        { label: "Detalle de actividad" },
      ];
    }

    if (pageKey === "activityPaidList") {
      return [
        rootCrumb,
        { label: "Actividades", to: ROUTES.dashboardActivities },
        { label: "Detalle de actividad", to: ROUTES.dashboardActivityDetail(activityDetailId || ":activityId") },
        { label: "Lista de pagados" },
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
  }, [pageKey, studentSummaryQuery.isLoading, studentSummaryQuery.data, activeRole, activityDetailId]);

  const leftPad = isDesktop ? (expanded ? SIDEBAR_WIDTHS.expanded : SIDEBAR_WIDTHS.collapsed) : 0;

  const activeAccount = useMemo(() => ({ role: activeRole, campus: activeCampus }), [activeRole, activeCampus]);

  const handleAccountChange = (account) => {
    setActiveAccount?.(account);
    navigate(ROUTES.dashboard, { replace: true });
    queryClient.invalidateQueries({ queryKey: ["students"] });
    queryClient.invalidateQueries({ queryKey: ["families"] });
    queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    queryClient.invalidateQueries({ queryKey: ["payments"] });
    queryClient.invalidateQueries({ queryKey: ["activities"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["attendance"] });
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-gray-50 md:h-screen md:overflow-hidden">
      <Sidebar
        navItems={navItems}
        activeItemTo={activeItemTo}
        activeCampus={activeCampus}
        onLogout={logout}
        onExpandChange={setExpanded}
      />

      <MobileSidebarOverlay
        open={mobileNavOpen}
        navItems={navItems}
        activeItemTo={activeItemTo}
        activeCampus={activeCampus}
        accountOptions={accountOptions}
        activeAccount={activeAccount}
        onAccountChange={handleAccountChange}
        onLogout={logout}
        onClose={() => setMobileNavOpen(false)}
      />

      <Topbar
        accountOptions={accountOptions}
        activeAccount={activeAccount}
        onAccountChange={handleAccountChange}
        offsetLeft={leftPad}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />

      <main
        className="flex min-h-0 flex-1 flex-col overflow-visible transition-[padding-left] duration-300 ease-out md:h-full md:overflow-hidden"
        style={{ paddingLeft: leftPad }}
      >
        <div
          className="flex min-h-0 flex-col gap-4 overflow-visible px-4 pb-4 pt-0 md:h-full md:overflow-hidden md:px-6 md:pb-1"
          style={{ paddingTop: DASHBOARD_TOPBAR_HEIGHT + 8 }}
        >
          <BreadcrumbHeader
            activeCampus={activeCampus}
            title={pageMeta.title}
            description={pageMeta.description}
            breadcrumbItems={breadcrumbItems}
          />

          <section className="flex flex-1 min-h-0 flex-col overflow-visible rounded-2xl border border-gray-100 bg-white shadow-sm md:overflow-hidden">
            <div className="min-h-0 p-4 md:h-full md:overflow-y-auto md:p-5">
              <Outlet />
            </div>
          </section>
        </div>
      </main>

      <PoweredBy />
    </div>
  );
}
