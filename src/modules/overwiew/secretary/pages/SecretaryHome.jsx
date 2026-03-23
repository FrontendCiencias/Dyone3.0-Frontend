import React from "react";
import { Building2, RefreshCcw } from "lucide-react";
import { useAuth } from "../../../../lib/auth";
import { useSecretaryOverviewQuery } from "../../../dashboard/hooks/useSecretaryOverviewQuery";
import SecretaryKpis from "../components/SecretaryKpis";
import RecentEnrollments from "../components/RecentEnrollments";
import PendingPayments from "../components/PendingPayments";
import AlertsPanel from "../components/AlertsPanel";
import CashTodaySummary from "../components/CashTodaySummary";

function LoadingBlock() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="h-4 w-28 rounded-full bg-gray-100" />
        <div className="mt-3 h-8 w-72 rounded-full bg-gray-100" />
        <div className="mt-2 h-4 w-full max-w-2xl rounded-full bg-gray-50" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="h-4 w-24 rounded-full bg-gray-100" />
            <div className="mt-4 h-8 w-20 rounded-full bg-gray-100" />
            <div className="mt-3 h-4 w-32 rounded-full bg-gray-50" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorBlock({ onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">
        Inicio de Secretaría
      </div>
      <div className="mt-2 text-xl font-semibold text-gray-900">
        No se pudo cargar el panel operativo
      </div>
      <div className="mt-2 max-w-2xl text-sm text-gray-600">
        Intenta recargar para recuperar pendientes, seguimiento financiero y actividad reciente.
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <RefreshCcw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  );
}

function campusLabel(activeCampus) {
  if (!activeCampus || String(activeCampus).toUpperCase() === "ALL") return "Todos los campus";
  return activeCampus;
}

export default function SecretaryHome() {
  const { activeCampus } = useAuth();
  const scopedCampus = activeCampus && String(activeCampus).toUpperCase() !== "ALL" ? activeCampus : undefined;
  const q = useSecretaryOverviewQuery({ enabled: true, campus: scopedCampus });

  if (q.isLoading) return <LoadingBlock />;
  if (q.isError) return <ErrorBlock onRetry={() => q.refetch()} />;

  const data = q.data || {};

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
              Secretaría
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
              Inicio operativo
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Pendientes críticos, seguimiento financiero y actividad reciente en una sola vista
              para priorizar el trabajo del día.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
            <Building2 className="h-4 w-4 text-gray-500" />
            {campusLabel(activeCampus)}
          </div>
        </div>
      </section>

      <SecretaryKpis data={data} activeCampus={activeCampus} />

      <CashTodaySummary data={data?.cashToday} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <AlertsPanel data={data} />
        </div>

        <div className="xl:col-span-4">
          <PendingPayments data={data} />
        </div>

        <div className="xl:col-span-3">
          <RecentEnrollments data={data} />
        </div>
      </div>
    </div>
  );
}
