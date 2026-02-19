import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Topbar, { DASHBOARD_TOPBAR_HEIGHT } from "./components/Topbar";
import Sidebar, { SIDEBAR_WIDTHS } from "./components/Sidebar";
import BreadcrumbHeader from "./components/BreadcrumbHeader";
import PoweredBy from "./components/PoweredBy";
import { getNavItemsByRole } from "./config/navByRole";
import { useAuth } from "../../lib/auth";
import { ROUTES } from "../../config/routes";
import { useStudentSummaryQuery } from "../students/hooks/useStudentSummaryQuery";
import { useFamilyDetailQuery } from "../families/hooks/useFamilyDetailQuery";

const PAGE_META = {
  dashboard: { title: "Inicio", description: "Resumen operativo y alertas clave del día." },
  students: { title: "Alumnos", description: "Busca, filtra y gestiona expedientes estudiantiles." },
  studentDetail: { title: "Expediente del alumno", description: "Consulta identidad, matrícula, aula y finanzas." },
  adminSettings: { title: "Configuración", description: "Sedes, ciclos, aulas y conceptos." },
  adminDev: { title: "Desarrollo", description: "Endpoints, modelos y utilidades técnicas." },
  enrollments: { title: "Matrículas", description: "Monitorea y registra el flujo de matrículas." },
  payments: { title: "Pagos", description: "Controla cobros, vencimientos y estado de pagos." },
  families: { title: "Familias", description: "Gestiona tutores y relación familiar de alumnos." },
  familyDetail: { title: "Ficha de familia", description: "Revisa tutores e hijos vinculados de la familia." },
  notFound: { title: "Página no encontrada", description: "La ruta no existe en el panel." },
};

function resolvePageKey(pathname) {
  if (pathname === ROUTES.dashboard) return "dashboard";
  if (/^\/dashboard\/students\/[^/]+$/.test(pathname)) return "studentDetail";
  if (pathname.startsWith(ROUTES.dashboardStudents)) return "students";
  if (pathname.startsWith(ROUTES.dashboardAdminDev)) return "adminDev";
  if (pathname.startsWith(ROUTES.dashboardAdminSettings) || pathname === ROUTES.dashboardAdmin) return "adminSettings";
  if (pathname.startsWith(ROUTES.dashboardEnrollments)) return "enrollments";
  if (pathname.startsWith(ROUTES.dashboardPayments)) return "payments";
  if (/^\/dashboard\/families\/[^/]+$/.test(pathname)) return "familyDetail";
  if (pathname.startsWith(ROUTES.dashboardFamilies)) return "families";
  if (pathname.startsWith("/dashboard/")) return "notFound";
  return "dashboard";
}

function getStudentBreadcrumbLabel(summary) {
  const student = summary?.student || {};
  const full = [student?.lastNames, student?.names].filter(Boolean).join(", ").trim();
  if (full) return full;
  return student?.internalCode || student?.code || "Alumno...";
}

export default function DashboardShell() {
  const { roles, activeRole, setActiveRole, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    const match = (location.pathname || "").match(/^\/dashboard\/students\/([^/]+)$/);
    return match?.[1] || null;
  }, [location.pathname]);

  const studentSummaryQuery = useStudentSummaryQuery(studentId, pageKey === "studentDetail");
  const familyId = useMemo(() => {
    const match = (location.pathname || "").match(/^\/dashboard\/families\/([^/]+)$/);
    return match?.[1] || null;
  }, [location.pathname]);
  const familyDetailQuery = useFamilyDetailQuery(familyId, pageKey === "familyDetail");

  const pageMeta = useMemo(() => {
    if (pageKey === "familyDetail") {
      return {
        title: `Familia: ${familyId || "Detalle"}`,
        description: PAGE_META.familyDetail.description,
      };
    }

    if (pageKey !== "studentDetail") return PAGE_META[pageKey] || PAGE_META.dashboard;

    const label = studentSummaryQuery.isLoading
      ? "Alumno..."
      : getStudentBreadcrumbLabel(studentSummaryQuery.data);

    return {
      title: `Expediente: ${label}`,
      description: PAGE_META.studentDetail.description,
    };
  }, [pageKey, studentSummaryQuery.isLoading, studentSummaryQuery.data, familyId]);

  const breadcrumbItems = useMemo(() => {
    if (pageKey === "familyDetail") {
      const tutor = familyDetailQuery.data?.family?.primaryTutor || familyDetailQuery.data?.primaryTutor;
      const label = tutor
        ? [tutor?.lastNames, tutor?.names].filter(Boolean).join(", ")
        : `ID ${familyId || "-"}`;

      return [
        { label: "Inicio", to: ROUTES.dashboard },
        { label: "Familias", to: ROUTES.dashboardFamilies },
        { label },
      ];
    }

    if (pageKey === "adminSettings") {
      return [
        { label: "Inicio", to: ROUTES.dashboard },
        { label: "Admin", to: ROUTES.dashboardAdminSettings },
        { label: "Configuración" },
      ];
    }

    if (pageKey === "adminDev") {
      return [
        { label: "Inicio", to: ROUTES.dashboard },
        { label: "Admin", to: ROUTES.dashboardAdminSettings },
        { label: "Desarrollo" },
      ];
    }

    if (pageKey !== "studentDetail") return null;

    const label = studentSummaryQuery.isLoading
      ? "Alumno..."
      : getStudentBreadcrumbLabel(studentSummaryQuery.data);

    return [
      { label: "Inicio", to: ROUTES.dashboard },
      { label: "Alumnos", to: ROUTES.dashboardStudents },
      { label },
    ];
  }, [pageKey, studentSummaryQuery.isLoading, studentSummaryQuery.data, familyDetailQuery.data, familyId]);

  const leftPad = expanded ? SIDEBAR_WIDTHS.expanded : SIDEBAR_WIDTHS.collapsed;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Sidebar
        navItems={navItems}
        activeItemTo={activeItemTo}
        activeRole={activeRole}
        onLogout={logout}
        onExpandChange={setExpanded}
      />

      <Topbar
        roles={roles}
        activeRole={activeRole}
        onRoleChange={(r) => {
          setActiveRole?.(r);
          navigate(ROUTES.dashboard, { replace: true });
        }}
        offsetLeft={leftPad}
      />

      <main
        className="flex flex-1 min-h-0 flex-col overflow-hidden transition-[padding-left] duration-300 ease-out"
        style={{ paddingLeft: leftPad }}
      >
        <div
          className="flex h-full min-h-0 flex-col gap-4 overflow-hidden px-4 pb-4 pt-0 md:px-6"
          style={{ paddingTop: DASHBOARD_TOPBAR_HEIGHT + 8 }}
        >
          <BreadcrumbHeader
            activeRole={activeRole}
            title={pageMeta.title}
            description={pageMeta.description}
            breadcrumbItems={breadcrumbItems}
          />

          <section className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="h-full overflow-auto p-4 md:p-5">
              <Outlet />
            </div>
          </section>
        </div>
      </main>

      <PoweredBy />
    </div>
  );
}
