import React, { useMemo, useState } from "react";
import { useAuth } from "../../../lib/auth";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import CampusesSection from "../components/CampusesSection";
import CyclesSection from "../components/CyclesSection";
import ClassroomsSection from "../components/ClassroomsSection";
import BillingConceptsSection from "../components/BillingConceptsSection";
import DevelopmentSection from "../components/DevelopmentSection";

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
  const [activeTab, setActiveTab] = useState("settings");

  const tabs = useMemo(
    () => [
      { key: "settings", label: "Configuración" },
      { key: "development", label: "Desarrollo" },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
        Ajusta catálogos maestros y herramientas internas del sistema.
      </p>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <SecondaryButton
              key={tab.key}
              className={isActive ? "border-gray-900 text-gray-900" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </SecondaryButton>
          );
        })}
      </div>

      {activeTab === "settings" ? (
        <>
          <CampusesSection canAccess={canAccess} />
          <CyclesSection canAccess={canAccess} />
          <ClassroomsSection canAccess={canAccess} />
          <BillingConceptsSection canAccess={canAccess} />
        </>
      ) : (
        <DevelopmentSection canAccess={canAccess} />
      )}
    </div>
  );
}
