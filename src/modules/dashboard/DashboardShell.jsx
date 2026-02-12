// src/modules/dashboard/DashboardShell.jsx
import React, { useEffect, useState, useMemo} from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Topbar, { DASHBOARD_TOPBAR_HEIGHT } from "./components/Topbar";
import Sidebar, { SIDEBAR_WIDTHS } from "./components/Sidebar";
import BreadcrumbHeader from "./components/BreadcrumbHeader";
import PoweredBy from "./components/PoweredBy";
import { getNavItemsByRole } from "./config/navByRole";
import { useAuth } from "../../lib/auth";

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
      const prefix = pathname.startsWith(to + "/");

      if (exact || prefix) {
        if (!best || to.length > best.to.length) best = item;
      }
    }
    return best?.to ?? null;
  }, [location.pathname, navItems]);

  const leftPad = expanded ? SIDEBAR_WIDTHS.expanded : SIDEBAR_WIDTHS.collapsed;

  const pageTitle = useMemo(() => {
    const path = location.pathname || "/dashboard";
    if (path.startsWith("/dashboard/enrollments")) return "Matrículas";
    if (path.startsWith("/dashboard/payments")) return "Pagos";
    if (path.startsWith("/dashboard/families")) return "Familias";
    if (path.startsWith("/dashboard/students")) return "Alumnos";
    if (path.startsWith("/dashboard/admin")) return "Administración";
    return "Inicio";
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Sidebar: full height, sin que el topbar lo “corte” */}
      <Sidebar
        navItems={navItems}
        activeItemTo={activeItemTo}
        activeRole={activeRole}
        onLogout={logout}
        onExpandChange={setExpanded}
      />

      {/* Topbar: fijo, pero SOLO sobre el main (no sobre el sidebar) */}
      <Topbar
        roles={roles}
        activeRole={activeRole}
        onRoleChange={(r) => setActiveRole?.(r)}
        offsetLeft={leftPad}
      />

      {/* Main: NO scroll del body. Scroll solo dentro del card */}
      <main
        className="flex-1 overflow-hidden transition-[padding-left] duration-300 ease-out"
        style={{ paddingLeft: leftPad }}
      >
        {/* Espacio para topbar (solo dentro del main) */}
        <div
          className="h-full px-4 md:px-6 pt-0 pb-0 flex flex-col gap-4 overflow-hidden"
          style={{ paddingTop: DASHBOARD_TOPBAR_HEIGHT + 8 }}
        >

          <BreadcrumbHeader activeRole={activeRole} title={pageTitle} />

          <section
            className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden"
            style={{ height: "calc(100vh - 220px)" }}
          >
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
