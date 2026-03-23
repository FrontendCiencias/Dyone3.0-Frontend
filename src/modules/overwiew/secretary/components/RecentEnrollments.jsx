import React from "react";
import { ArrowRight, CreditCard, GraduationCap, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../config/routes";
import WidgetShell from "./WidgetShell";

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function activityTypeLabel(type) {
  return String(type || "").toUpperCase() === "PAYMENT" ? "Pago" : "Matrícula";
}

const quickActions = [
  { label: "Alumnos", to: ROUTES.dashboardStudents, icon: GraduationCap },
  { label: "Matrículas", to: ROUTES.dashboardEnrollments, icon: Home },
  { label: "Pagos", to: ROUTES.dashboardPayments, icon: CreditCard },
];

export default function RecentEnrollments({ data = {} }) {
  const navigate = useNavigate();
  const recentActivity = Array.isArray(data?.recentActivity) ? data.recentActivity.slice(0, 6) : [];

  return (
    <WidgetShell title="Actividad reciente" subtitle="Solo movimientos útiles para operar el día" className="h-full">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map(({ label, to, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(to)}
              className="flex items-center justify-between rounded-2xl border border-gray-100 px-3 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100">
                  <Icon className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-800">{label}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {recentActivity.length ? (
            recentActivity.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.to || ROUTES.dashboard)}
                className="flex w-full items-start justify-between gap-3 rounded-2xl border border-gray-100 px-3 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <div className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                    {activityTypeLabel(item.type)}
                  </div>
                  <div className="mt-2 truncate text-sm font-semibold text-gray-900">{item.title}</div>
                  <div className="mt-1 text-xs text-gray-500">{item.subtitle}</div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-gray-400">{formatDateTime(item.at)}</div>
                  <ArrowRight className="ml-auto mt-2 h-4 w-4 text-gray-400" />
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500">
              Todavía no hay actividad reciente útil para mostrar.
            </div>
          )}
        </div>
      </div>
    </WidgetShell>
  );
}
