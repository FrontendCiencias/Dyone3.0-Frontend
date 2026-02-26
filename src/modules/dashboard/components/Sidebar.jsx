// src/modules/dashboard/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { getRoleTheme } from "../config/roleTheme";

const SIDEBAR_COLLAPSED = 80; // w-20
const SIDEBAR_EXPANDED = 264; // ~w-64

export const SIDEBAR_WIDTHS = {
  collapsed: SIDEBAR_COLLAPSED,
  expanded: SIDEBAR_EXPANDED,
};

function getBrandByCampus(campus) {
  const c = String(campus || "").toUpperCase();
  if (c === "CIMAS") return { short: "CI", name: "CIMAS", subtitle: "Colegio" };
  if (c === "CIENCIAS_APLICADAS") return { short: "CA", name: "Ciencias Aplicadas", subtitle: "Plataforma" };
  if (c === "CIENCIAS") return { short: "C++", name: "Ciencias", subtitle: "Plataforma" };
  if (c === "ALL") return { short: "DY", name: "Dyone", subtitle: "Administración" };
  return { short: "DY", name: "Dyone", subtitle: "Plataforma" };
}

export default function Sidebar({
  navItems = [],
  activeItemTo,
  activeCampus,
  onLogout,
  onExpandChange,
}) {
  const theme = getRoleTheme(activeCampus);
  const brand = getBrandByCampus(activeCampus);
  const [logoutHover, setLogoutHover] = React.useState(false);


  return (
    <aside className="hidden md:block fixed left-0 top-0 z-20">
      <div
        className="
          group flex flex-col
          bg-white border-r border-gray-100
          shadow-sm
          w-20 hover:w-64
          transition-[width] duration-300 ease-out
          h-screen
        "
        onMouseEnter={() => onExpandChange?.(true)}
        onMouseLeave={() => onExpandChange?.(false)}
      >
        {/* Brand (arriba, sobre fondo blanco, sin card) */}
        <div className="px-3 pt-4">
          <div className="flex items-center gap-3 px-1 py-2 overflow-hidden">
            {/* Logo */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0"
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${theme.main}, ${theme.dark})`,
              }}
              title={brand.name}
            >
              {brand.short}
            </div>

            {/* Nombre + subtítulo (solo expandido) */}
            <div
              className="
                min-w-0
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200
              "
            >
              <div className="text-ml font-semibold text-gray-900 truncate">
                {brand.name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {brand.subtitle}
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="mt-3 h-px bg-gray-100" />
        </div>

        {/* Nav (pegado debajo del logo) */}
        <nav className="px-3 pt-3 pb-4 flex flex-col gap-1 overflow-hidden">
          {navItems.map(({ to, label, description, icon: Icon }) => {
            const active = activeItemTo === to;

            return (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-3 rounded-2xl px-3.5 py-2.5
                  transition-colors duration-200
                  ${active ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}
                `}
                style={active ? { backgroundColor: theme.softBg } : undefined}
                title={label}
              >
                <Icon
                  className={`
                    w-7 h-7 flex-shrink-0
                    ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}
                  `}
                  style={active ? { color: theme.main } : undefined}
                />

                {/* Texto (solo expandido) */}
                <div
                  className="
                    min-w-0
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                  "
                >
                  <div className="text-sm font-semibold truncate">{label}</div>
                  {description ? (
                    <div className="text-xs text-gray-500 truncate">{description}</div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout abajo */}
        <div className="px-1 pb-1 mt-auto">
          

          {/* Overlay botón real para hover theme (sin JS) */}
          <div className="px-3 pb-4 mt-auto">
            <button
              type="button"
              onClick={onLogout}
              onMouseEnter={() => setLogoutHover(true)}
              onMouseLeave={() => setLogoutHover(false)}
              className="
                w-full flex items-center gap-3
                rounded-2xl px-3 py-2.5
                transition-colors duration-200
                overflow-hidden
              "
              style={
                logoutHover
                  ? { backgroundColor: theme.main, color: "#fff" }
                  : { backgroundColor: "transparent", color: "#374151" } // gray-700
              }
              title="Cerrar sesión"
            >
              <LogOut
                className="w-7 h-7 flex-shrink-0 opacity-90"
                style={logoutHover ? { color: "#fff" } : undefined}
              />

              <div
                className="
                  min-w-0
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                "
              >
                <div className="text-sm font-semibold truncate">Cerrar sesión</div>
                <div
                  className="text-xs truncate"
                  style={logoutHover ? { color: "rgba(255,255,255,0.85)" } : { color: "#6B7280" }}
                >
                  Salir de tu cuenta
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
