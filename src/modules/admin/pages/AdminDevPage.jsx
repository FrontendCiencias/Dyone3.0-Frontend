import React from "react";
import { useAuth } from "../../../lib/auth";
import DevelopmentSection from "../components/DevelopmentSection";
import { roleCanManageAdminSettings } from "../utils/permissions";

export default function AdminDevPage() {
  const { activeRole } = useAuth();
  const canAccess = roleCanManageAdminSettings(activeRole);

  return <DevelopmentSection canAccess={canAccess} />;
}
