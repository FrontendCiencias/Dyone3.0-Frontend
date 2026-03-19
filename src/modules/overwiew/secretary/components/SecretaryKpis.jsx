import React from "react";
import { CircleAlert, GraduationCap, ReceiptText, UserCheck } from "lucide-react";
import { getRoleTheme } from "../../../dashboard/config/roleTheme";

function formatNumber(value) {
  return new Intl.NumberFormat("es-PE").format(Number(value || 0));
}

function KpiCard({ icon: Icon, label, value, hint, accent }) {
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
            backgroundColor: accent.softBg,
            borderColor: "rgba(17,24,39,0.08)",
          }}
        >
          <Icon className="h-5 w-5" style={{ color: accent.main }} />
        </div>
      </div>
    </article>
  );
}

export default function SecretaryKpis({ data, activeCampus }) {
  const theme = getRoleTheme(activeCampus);
  const summary = data?.summary || {};
  const critical = data?.critical || {};

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={UserCheck}
        label="Alumnos activos"
        value={summary.activeStudents}
        hint="Estado operativo del ciclo escolar actual"
        accent={theme}
      />
      <KpiCard
        icon={CircleAlert}
        label="Pendientes abiertos"
        value={summary.openIssues}
        hint={`Sin familia ${critical.studentsWithoutFamilyCount || 0} · Incompletos ${critical.incompleteStudentsCount || 0}`}
        accent={theme}
      />
      <KpiCard
        icon={GraduationCap}
        label="Matrículas recientes"
        value={summary.recentEnrollments}
        hint="Registradas en los últimos 7 días"
        accent={theme}
      />
      <KpiCard
        icon={ReceiptText}
        label="Pagos de hoy"
        value={summary.paymentsToday}
        hint="Movimientos registrados durante el día"
        accent={theme}
      />
    </div>
  );
}
