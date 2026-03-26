import React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WidgetShell from "../../secretary/components/WidgetShell";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  return date.toLocaleString("es-PE", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminRecentActivity({ data = {} }) {
  const navigate = useNavigate();
  const items = Array.isArray(data.recentActivity) ? data.recentActivity : [];

  return (
    <WidgetShell title="Actividad reciente" subtitle="Movimientos que vale la pena revisar" className="h-full">
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => item.to && navigate(item.to)}
              className="flex w-full items-start justify-between gap-3 rounded-2xl border border-gray-100 px-3 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                <div className="mt-1 text-xs text-gray-500">{item.subtitle}</div>
                <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
                  {item.type} · {formatDateTime(item.at)}
                </div>
              </div>
              <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 px-3 py-5 text-sm text-gray-500">
          No hay actividad reciente relevante para mostrar.
        </div>
      )}
    </WidgetShell>
  );
}
