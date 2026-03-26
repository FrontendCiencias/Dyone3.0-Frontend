import React, { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useAuth } from "../../../../lib/auth";
import { useAdminOverviewQuery } from "../../../dashboard/hooks/useAdminOverviewQuery";
import AdminKpis from "../components/AdminKpis";
import AdminAlertsPanel from "../components/AdminAlertsPanel";
import AdminRecentActivity from "../components/AdminRecentActivity";
import AdminQuickActions from "../components/AdminQuickActions";

function revealClass(isVisible) {
  return `transition-all duration-500 ${isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`;
}

function LoadingBlock() {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const timers = [250, 500, 750].map((delay, index) =>
      window.setTimeout(() => setVisibleCount(index + 2), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

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
        Inicio de Admin
      </div>
      <div className="mt-2 text-xl font-semibold text-gray-900">
        No se pudo cargar el panel administrativo
      </div>
      <div className="mt-2 max-w-2xl text-sm text-gray-600">
        Intenta recargar para recuperar alertas, salud operativa y actividad reciente.
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

export default function AdminHome() {
  const { activeCampus } = useAuth();
  const scopedCampus = activeCampus && String(activeCampus).toUpperCase() !== "ALL" ? activeCampus : undefined;
  const q = useAdminOverviewQuery({ enabled: true, campus: scopedCampus });
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (q.isLoading || q.isError) return;
    setVisibleCount(1);
    const timers = [250, 500, 750].map((delay, index) =>
      window.setTimeout(() => setVisibleCount(index + 2), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [q.isLoading, q.isError, q.dataUpdatedAt]);

  if (q.isLoading) return <LoadingBlock />;
  if (q.isError) return <ErrorBlock onRetry={() => q.refetch()} />;

  const data = q.data || {};

  return (
    <div className="space-y-4">
      <div className={revealClass(visibleCount >= 1)}>
        <AdminKpis data={data} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className={`xl:col-span-5 ${revealClass(visibleCount >= 2)}`}>
          <AdminAlertsPanel data={data} />
        </div>

        <div className={`xl:col-span-4 ${revealClass(visibleCount >= 3)}`}>
          <AdminRecentActivity data={data} />
        </div>

        <div className={`xl:col-span-3 ${revealClass(visibleCount >= 4)}`}>
          <AdminQuickActions data={data} />
        </div>
      </div>
    </div>
  );
}
