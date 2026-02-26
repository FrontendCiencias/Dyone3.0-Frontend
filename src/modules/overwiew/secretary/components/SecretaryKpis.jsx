import React from "react";
import { Users, BadgeDollarSign, AlertCircle, CalendarDays } from "lucide-react";
import { getRoleTheme } from "../../../dashboard/config/roleTheme";

function KpiCard({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-gray-500">{label}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {value ?? "—"}
          </div>
          {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
        </div>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border"
          style={{
            backgroundColor: accent.softBg,
            borderColor: "rgba(0,0,0,0.06)",
          }}
        >
          <Icon className="w-5 h-5" style={{ color: accent.main }} />
        </div>
      </div>
    </div>
  );
}

export default function SecretaryKpis({ data, activeCampus }) {
  const theme = getRoleTheme(activeCampus);

  const k = data?.kpis || {};
  const todayEnrollments = k.todayEnrollments ?? 0;
  const monthEnrollments = k.monthEnrollments ?? 0;
  const pendingPayments = k.pendingPayments ?? 0;
  const overduePayments = k.overduePayments ?? 0;

  const accent = theme;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        icon={CalendarDays}
        label="Matrículas de hoy"
        value={todayEnrollments}
        hint="Registros creados hoy"
        accent={accent}
      />
      <KpiCard
        icon={Users}
        label="Matrículas del mes"
        value={monthEnrollments}
        hint="Total acumulado del mes"
        accent={accent}
      />
      <KpiCard
        icon={BadgeDollarSign}
        label="Pagos pendientes"
        value={pendingPayments}
        hint="Por cobrar"
        accent={accent}
      />
      <KpiCard
        icon={AlertCircle}
        label="Vencidos"
        value={overduePayments}
        hint="Requieren seguimiento"
        accent={accent}
      />
    </div>
  );
}
