import React from "react";
import { useAuth } from "../../../lib/auth";
import CampusesSection from "../components/CampusesSection";
import CyclesSection from "../components/CyclesSection";
import ClassroomsSection from "../components/ClassroomsSection";
import BillingConceptsSection from "../components/BillingConceptsSection";

function roleCanManageAdminSettings(role) {
  const safeRole = String(role || "").toUpperCase();
  return (
    safeRole.startsWith("ADMIN") ||
    safeRole.startsWith("SECRETARY") ||
    safeRole.startsWith("DIRECTOR") ||
    safeRole.startsWith("PROMOTER")
  );
}

export default function AdminSettingsPage() {
  const { activeRole } = useAuth();
  const canAccess = roleCanManageAdminSettings(activeRole);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <h2 className="text-xl font-semibold text-blue-900">Configuración Administrativa</h2>
        <p className="mt-1 text-sm text-blue-800">
          Gestiona sedes, ciclos, aulas y conceptos de cobro del sistema.
        </p>
      </div>

      <CampusesSection canAccess={canAccess} />
      <CyclesSection canAccess={canAccess} />
      <ClassroomsSection canAccess={canAccess} />
      <BillingConceptsSection canAccess={canAccess} />
    </div>
  );
}
