import React from "react";
import { ArrowRight, CalendarClock, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../config/routes";
import WidgetShell from "./WidgetShell";

function formatMoney(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

function DebtRow({ item, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-gray-100 px-3 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-gray-900">{item.fullName}</div>
        <div className="mt-1 truncate text-xs text-gray-500">
          {[item.code || "Sin código", item.campus || "Campus no definido"].filter(Boolean).join(" · ")}
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-semibold text-gray-950">{formatMoney(item.totalPending)}</div>
        <div className="mt-1 text-xs text-amber-700">Vencido {formatMoney(item.totalOverdue)}</div>
      </div>
    </button>
  );
}

function DueRow({ item, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-gray-100 px-3 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-gray-900">{item.fullName}</div>
        <div className="mt-1 truncate text-xs text-gray-500">{item.concept}</div>
      </div>

      <div className="text-right">
        <div className="text-sm font-semibold text-gray-950">{formatMoney(item.pendingAmount)}</div>
        <div className="mt-1 text-xs text-gray-500">{formatDate(item.dueDate)}</div>
      </div>
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500">
      {text}
    </div>
  );
}

export default function PendingPayments({ data = {} }) {
  const navigate = useNavigate();
  const topDebtors = Array.isArray(data?.topDebtors) ? data.topDebtors.slice(0, 4) : [];
  const upcomingDue = Array.isArray(data?.upcomingDue) ? data.upcomingDue.slice(0, 4) : [];
  const overdueCount = data?.critical?.overdueStudentsCount || 0;

  return (
    <WidgetShell
      title="Seguimiento financiero"
      subtitle="Qué deuda o vencimiento requiere atención hoy"
      right={
        <button
          type="button"
          onClick={() => navigate(ROUTES.dashboardPayments)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 transition hover:text-gray-900"
        >
          Ir a pagos
          <ArrowRight className="h-4 w-4" />
        </button>
      }
      className="h-full"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            <TriangleAlert className="h-4 w-4" />
            Deuda vencida
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-amber-900">{overdueCount}</div>
          <div className="mt-1 text-sm text-amber-800">Alumnos requieren seguimiento inmediato.</div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            Alumnos con mayor deuda
          </div>
          {topDebtors.length ? (
            <div className="space-y-2">
              {topDebtors.map((item) => (
                <DebtRow
                  key={item.studentId}
                  item={item}
                  onClick={() => navigate(ROUTES.dashboardPaymentDetail(item.studentId))}
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No hay deuda vencida prioritaria en el campus actual." />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            <CalendarClock className="h-4 w-4 text-gray-400" />
            Próximos vencimientos
          </div>
          {upcomingDue.length ? (
            <div className="space-y-2">
              {upcomingDue.map((item) => (
                <DueRow
                  key={item.chargeId}
                  item={item}
                  onClick={() => navigate(ROUTES.dashboardPaymentDetail(item.studentId))}
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No hay cargos próximos a vencer en los próximos 7 días." />
          )}
        </div>
      </div>
    </WidgetShell>
  );
}
