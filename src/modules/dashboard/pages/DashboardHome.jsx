import React from "react";
import { useAuth } from "../../../lib/auth";
import AuxiliarHome from "../../overwiew/auxiliar/pages/AuxiliarHome";
import SecretaryHome from "../../overwiew/secretary/pages/SecretaryHome";

function roleGroup(role) {
  const r = String(role || "").toUpperCase();
  if (["SECRETARY", "SECRETARY_VIEWER"].includes(r)) return "SECRETARY";
  if (r === "AUXILIAR") return "AUXILIAR";
  if (r === "ADMIN") return "ADMIN";
  if (r === "DIRECTOR") return "DIRECTOR";
  if (r === "PROMOTER") return "PROMOTER";
  return "DEFAULT";
}

function Placeholder({ title = "Módulo en construcción" }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="text-base font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-600 mt-1">
        Este rol tendrá su panel pronto.
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { roles, activeRole } = useAuth();
  const role = activeRole || roles?.[0] || "";
  const group = roleGroup(role);

  if (group === "SECRETARY") return <SecretaryHome />;
  if (group === "AUXILIAR") return <AuxiliarHome />;

  if (group === "ADMIN") return <Placeholder title="Panel de Admin" />;
  if (group === "DIRECTOR") return <Placeholder title="Panel de Dirección" />;
  if (group === "PROMOTER") return <Placeholder title="Panel de Promotor" />;

  return <Placeholder title="Panel" />;
}
