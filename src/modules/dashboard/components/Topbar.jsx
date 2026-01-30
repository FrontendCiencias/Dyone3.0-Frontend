// src/modules/dashboard/components/Topbar.jsx
import React from "react";
import RoleSwitcher from "./RoleSwitcher";

const TOPBAR_HEIGHT = 48;

export const DASHBOARD_TOPBAR_HEIGHT = TOPBAR_HEIGHT;

export default function Topbar({ roles, activeRole, onRoleChange, offsetLeft = 80 }) {
  return (
    <header
      className="fixed top-0 right-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100"
      style={{
        height: TOPBAR_HEIGHT,
        left: offsetLeft,
      }}
    >
      <div className="h-full flex items-center justify-end px-3 md:px-4">
        <RoleSwitcher roles={roles} activeRole={activeRole} onChange={onRoleChange} />
      </div>
    </header>
  );
}
