import React from "react";
import { useAuth } from "../../../lib/auth";
import CampusesSection from "../components/CampusesSection";
import CyclesSection from "../components/CyclesSection";
import ClassroomsSection from "../components/ClassroomsSection";
import BillingConceptsSection from "../components/BillingConceptsSection";
import { roleCanManageAdminSettings } from "../utils/permissions";

export default function AdminConfigPage() {
  const { activeRole } = useAuth();
  const canAccess = roleCanManageAdminSettings(activeRole);

  return (
    <div className="space-y-4">
      <CampusesSection canAccess={canAccess} />
      <CyclesSection canAccess={canAccess} />
      <ClassroomsSection canAccess={canAccess} />
      <BillingConceptsSection canAccess={canAccess} />
    </div>
  );
}
