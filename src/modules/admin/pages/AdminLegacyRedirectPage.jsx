import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../../config/routes";

function getRedirectPath(search) {
  const params = new URLSearchParams(search || "");
  const tab = (params.get("tab") || "").toLowerCase();

  if (["dev", "development"].includes(tab)) {
    const devTab = params.get("devTab");
    const nextParams = new URLSearchParams();

    if (["endpoints", "models"].includes(devTab)) {
      nextParams.set("devTab", devTab);
    }

    const query = nextParams.toString();
    return query ? `${ROUTES.dashboardAdminDev}?${query}` : ROUTES.dashboardAdminDev;
  }

  return ROUTES.dashboardAdminSettings;
}

export default function AdminLegacyRedirectPage() {
  const location = useLocation();
  const to = getRedirectPath(location.search);

  return <Navigate to={to} replace />;
}
