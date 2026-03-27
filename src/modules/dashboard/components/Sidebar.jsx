// src/modules/dashboard/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { getRoleTheme } from "../config/roleTheme";
import SchoolLogo from "../../../shared/ui/SchoolLogo";
import RoleSwitcher from "./RoleSwitcher";

const SIDEBAR_COLLAPSED = 80;
const SIDEBAR_EXPANDED = 264;

export const SIDEBAR_WIDTHS = {
  collapsed: SIDEBAR_COLLAPSED,
  expanded: SIDEBAR_EXPANDED,
};

export function getBrandByCampus(campus) {
  const c = String(campus || "").toUpperCase();
  if (c === "CIMAS") return { short: "CI", name: "CIMAS", subtitle: "Colegio" };
  if (c === "CIENCIAS_APLICADAS") return { short: "CA", name: "Ciencias Aplicadas", subtitle: "Plataforma" };
  if (c === "CIENCIAS") return { short: "C++", name: "Ciencias", subtitle: "Plataforma" };
  if (c === "ALL") return { short: "DY", name: "Dyone", subtitle: "Administracion" };
  return { short: "DY", name: "Dyone", subtitle: "Plataforma" };
}

function SidebarBrand({ brand, theme, expanded = false }) {
  return (
    <div className="flex items-center gap-3 px-1 py-2 overflow-hidden">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
        style={{
          backgroundImage: `linear-gradient(to bottom right, ${theme.main}, ${theme.dark})`,
        }}
        title={brand.name}
      >
        <SchoolLogo className="h-8 w-8" color="#FFFFFF" title="" />
      </div>

      <div
        className={
          expanded
            ? "min-w-0 opacity-100 transition-opacity duration-200"
            : "min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        }
      >
        <div className="text-ml font-semibold text-gray-900 truncate">{brand.name}</div>
        <div className="text-xs text-gray-500 truncate">{brand.subtitle}</div>
      </div>
    </div>
  );
}

function LogoutButton({ theme, onLogout, expanded = false }) {
  const [logoutHover, setLogoutHover] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onLogout}
      onMouseEnter={() => setLogoutHover(true)}
      onMouseLeave={() => setLogoutHover(false)}
      className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200 overflow-hidden"
      style={
        logoutHover
          ? { backgroundColor: theme.main, color: "#fff" }
          : { backgroundColor: "transparent", color: "#374151" }
      }
      title="Cerrar sesion"
    >
      <LogOut
        className="w-7 h-7 flex-shrink-0 opacity-90"
        style={logoutHover ? { color: "#fff" } : undefined}
      />

      <div
        className={
          expanded
            ? "min-w-0 opacity-100 transition-opacity duration-200"
            : "min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        }
      >
        <div className="text-sm font-semibold truncate">Cerrar sesion</div>
        <div
          className="text-xs truncate"
          style={logoutHover ? { color: "rgba(255,255,255,0.85)" } : { color: "#6B7280" }}
        >
          Salir de tu cuenta
        </div>
      </div>
    </button>
  );
}

export function MobileSidebarOverlay({
  open,
  navItems = [],
  activeItemTo,
  activeCampus,
  accountOptions = [],
  activeAccount,
  onAccountChange,
  onLogout,
  onClose,
}) {
  const theme = getRoleTheme(activeCampus);
  const brand = getBrandByCampus(activeCampus);

  React.useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const previous = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Cerrar menu"
      />

      <div className="relative flex h-full w-full flex-col bg-white">
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm"
                style={{
                  backgroundImage: `linear-gradient(to bottom right, ${theme.main}, ${theme.dark})`,
                }}
              >
                <SchoolLogo className="h-7 w-7" color="#FFFFFF" title="" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{brand.name}</div>
                <div className="truncate text-xs text-slate-500">{brand.subtitle}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Cerrar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <nav className="flex flex-col gap-2">
            {navItems.map(({ to, label, description, icon: Icon }) => {
              const active = activeItemTo === to;

              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors"
                  style={
                    active
                      ? {
                          backgroundColor: theme.softBg,
                          borderColor: theme.soft,
                          color: theme.main,
                        }
                      : {
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E5E7EB",
                          color: "#334155",
                        }
                  }
                >
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                    style={active ? { backgroundColor: "#FFFFFF" } : { backgroundColor: "#F8FAFC" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{label}</div>
                    {description ? <div className="truncate text-xs text-slate-500">{description}</div> : null}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 px-4 py-4">
          <div className="space-y-3">
            <RoleSwitcher
              accountOptions={accountOptions}
              activeAccount={activeAccount}
              onChange={(account) => {
                onAccountChange?.(account);
                onClose?.();
              }}
            />

            <button
              type="button"
              onClick={() => {
                onClose?.();
                onLogout?.();
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
        <div className="px-3 pt-4">
          <SidebarBrand brand={brand} theme={theme} />
          <div className="mt-3 h-px bg-gray-100" />
        </div>

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

                <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="text-sm font-semibold truncate">{label}</div>
                  {description ? <div className="text-xs text-gray-500 truncate">{description}</div> : null}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 mt-auto">
          <LogoutButton theme={theme} onLogout={onLogout} />
        </div>
      </div>
    </aside>
  );
}
