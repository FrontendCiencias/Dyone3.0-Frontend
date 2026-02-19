import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "development" ? "development" : "settings";

  const handleTabChange = (tabKey) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tabKey);
    if (tabKey !== "development") next.delete("devTab");
    setSearchParams(next, { replace: true });
  };

  const tabs = useMemo(
    () => [
      { key: "settings", label: "Configuración" },
      { key: "development", label: "Desarrollo" },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <SecondaryButton
              key={tab.key}
              className={isActive ? "border-gray-900 text-gray-900" : ""}
              onClick={() => handleTabChange(tab.key)}
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
