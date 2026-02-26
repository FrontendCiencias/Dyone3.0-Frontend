import React from "react";
import { useAuth } from "../../../../lib/auth";
import { useSecretaryOverviewQuery } from "../../../dashboard/hooks/useSecretaryOverviewQuery";
import SecretaryKpis from "../components/SecretaryKpis";
import RecentEnrollments from "../components/RecentEnrollments";
import PendingPayments from "../components/PendingPayments";
import AlertsPanel from "../components/AlertsPanel";

function LoadingBlock() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="text-sm text-gray-600">Cargando panel de secretaría…</div>
    </div>
  );
}

function ErrorBlock() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="text-sm font-semibold text-gray-900">No se pudo cargar el panel</div>
      <div className="text-sm text-gray-600 mt-1">
        Intenta recargar en unos segundos.
      </div>
    </div>
  );
}

export default function SecretaryHome() {
  const { activeCampus } = useAuth();

  const q = useSecretaryOverviewQuery({ enabled: true });

  if (q.isLoading) return <LoadingBlock />;
  if (q.isError) return <ErrorBlock />;

  const data = q.data || {};
  const recentEnrollments = Array.isArray(data.recentEnrollments) ? data.recentEnrollments : [];
  const pendingPayments = Array.isArray(data.pendingPayments) ? data.pendingPayments : [];
  const alerts = Array.isArray(data.alerts) ? data.alerts : [];

  return (
    <div className="space-y-4">
      <SecretaryKpis data={data} activeCampus={activeCampus} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <RecentEnrollments rows={recentEnrollments} />
          <PendingPayments rows={pendingPayments} />
        </div>

        <div className="xl:col-span-1">
          <AlertsPanel rows={alerts} />
        </div>
      </div>
    </div>
  );
}
