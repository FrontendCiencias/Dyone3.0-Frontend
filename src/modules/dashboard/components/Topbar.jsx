// src/modules/dashboard/components/Topbar.jsx
import React from "react";
import { Menu } from "lucide-react";
import RoleSwitcher from "./RoleSwitcher";
import SchoolLogo from "../../../shared/ui/SchoolLogo";
import { getBrandByCampus } from "./Sidebar";
import { getRoleTheme } from "../config/roleTheme";

const TOPBAR_HEIGHT = 48;

export const DASHBOARD_TOPBAR_HEIGHT = TOPBAR_HEIGHT;

export default function Topbar({
  accountOptions,
  activeAccount,
  onAccountChange,
  offsetLeft = 80,
  onOpenMobileNav,
}) {
  const brand = getBrandByCampus(activeAccount?.campus);
  const theme = getRoleTheme(activeAccount?.campus);

  return (
    <header
      className="fixed top-0 right-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100"
      style={{
        height: TOPBAR_HEIGHT,
        left: offsetLeft,
      }}
    >
      <div className="h-full flex items-center justify-between px-3 md:px-4 gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="md:hidden inline-flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 text-left transition hover:bg-slate-50"
          aria-label="Abrir menu"
        >
          <span
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl shadow-sm"
            style={{
              backgroundImage: `linear-gradient(to bottom right, ${theme.main}, ${theme.dark})`,
            }}
          >
            <SchoolLogo className="h-5 w-5" color="#FFFFFF" title="" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {brand.short}
            </span>
            <span className="block truncate text-xs font-semibold text-slate-800">{brand.name}</span>
          </span>
          <Menu className="h-4 w-4 flex-shrink-0 text-slate-400" />
        </button>

        <div className="flex items-center gap-2 ml-auto min-w-0">
          <RoleSwitcher accountOptions={accountOptions} activeAccount={activeAccount} onChange={onAccountChange} />
        </div>
      </div>
    </header>
  );
}
