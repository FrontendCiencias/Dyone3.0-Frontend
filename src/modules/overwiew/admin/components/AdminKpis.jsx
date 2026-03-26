import React from "react";
import { AlertTriangle, Building2, ReceiptText, Users } from "lucide-react";

function formatNumber(value) {
  return new Intl.NumberFormat("es-PE").format(Number(value || 0));
}

function KpiCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            {label}
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
            {formatNumber(value)}
          </div>
          <div className="mt-2 text-sm text-gray-500">{hint}</div>
        </div>

        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: tone.bg,
            borderColor: "rgba(17,24,39,0.08)",
          }}
        >
          <Icon className="h-5 w-5" style={{ color: tone.text }} />
        </div>
      </div>
    </article>
  );
}

const tones = {
  blue: { bg: "#eff6ff", text: "#1d4ed8" },
  amber: { bg: "#fffbeb", text: "#b45309" },
  emerald: { bg: "#ecfdf5", text: "#047857" },
  rose: { bg: "#fff1f2", text: "#be123c" },
};

export default function AdminKpis({ data = {} }) {
  const summary = data.summary || {};

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={Users}
        label="Alumnos activos"
        value={summary.activeStudents}
        hint="Base actual del ciclo operativo"
        tone={tones.blue}
      />
      <KpiCard
        icon={AlertTriangle}
        label="Matriculas ausentes"
        value={summary.absentEnrollments}
        hint="Pendientes de regularizacion"
        tone={tones.amber}
      />
      <KpiCard
        icon={ReceiptText}
        label="Pagos de hoy"
        value={summary.paymentsToday}
        hint="Movimientos registrados hoy"
        tone={tones.emerald}
      />
      <KpiCard
        icon={Building2}
        label="Cargos vencidos"
        value={summary.overdueCharges}
        hint="Total de cargos abiertos ya vencidos"
        tone={tones.rose}
      />
    </div>
  );
}
