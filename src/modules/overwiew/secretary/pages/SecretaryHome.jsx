import React, { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useAuth } from "../../../../lib/auth";
import { useSecretaryOverviewQuery } from "../../../dashboard/hooks/useSecretaryOverviewQuery";
import SecretaryKpis from "../components/SecretaryKpis";
import RecentEnrollments from "../components/RecentEnrollments";
import PendingPayments from "../components/PendingPayments";
import AlertsPanel from "../components/AlertsPanel";

function revealClass(isVisible) {
  return `transition-all duration-500 ${isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`;
}

function useProgressiveReveal(resetKey) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    setVisibleCount(1);
    const timers = [250, 500, 750].map((delay, index) =>
      window.setTimeout(() => setVisibleCount(index + 2), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [resetKey]);

  return visibleCount;
}

function LoadingBlock() {
  const visibleCount = useProgressiveReveal("secretary-loading");

  return (
    <div className="space-y-4">
      <div className={revealClass(visibleCount >= 1)}>
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className={`xl:col-span-5 ${revealClass(visibleCount >= 2)}`}>
          <div className="h-64 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm" />
        </div>
        <div className={`xl:col-span-4 ${revealClass(visibleCount >= 3)}`}>
          <div className="h-64 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm" />
        </div>
        <div className={`xl:col-span-3 ${revealClass(visibleCount >= 4)}`}>
          <div className="h-64 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm" />
        </div>
      </div>
    </div>
  );
}

function ErrorBlock({ onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">
        Inicio de Secretaria
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

export default function SecretaryHome() {
  const { activeCampus } = useAuth();
  const scopedCampus = activeCampus && String(activeCampus).toUpperCase() !== "ALL" ? activeCampus : undefined;
  const q = useSecretaryOverviewQuery({ enabled: true, campus: scopedCampus });
  const visibleCount = useProgressiveReveal(`secretary-${q.dataUpdatedAt || 0}`);

  if (q.isLoading) return <LoadingBlock />;
  if (q.isError) return <ErrorBlock onRetry={() => q.refetch()} />;

  const data = q.data || {};

  return (
    <div className="space-y-4">
      <div className={revealClass(visibleCount >= 1)}>
        <SecretaryKpis data={data} activeCampus={activeCampus} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className={`xl:col-span-5 ${revealClass(visibleCount >= 2)}`}>
          <AlertsPanel data={data} />
        </div>

        <div className={`xl:col-span-4 ${revealClass(visibleCount >= 3)}`}>
          <PendingPayments data={data} />
        </div>

        <div className={`xl:col-span-3 ${revealClass(visibleCount >= 4)}`}>
          <RecentEnrollments data={data} />
        </div>
      </div>
    </div>
  );
}
