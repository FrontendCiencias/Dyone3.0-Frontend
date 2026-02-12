import React from "react";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import WidgetShell from "./WidgetShell";

function iconByType(type) {
  const t = String(type || "").toLowerCase();
  if (t === "warning") return AlertTriangle;
  if (t === "success") return CheckCircle2;
  return Info;
}

export default function AlertsPanel({ rows = [] }) {
  return (
    <WidgetShell
      title="Alertas"
      subtitle="Acciones recomendadas"
    >
      {rows.length === 0 ? (
        <div className="text-sm text-gray-600">No hay alertas por ahora.</div>
      ) : (
        <div className="space-y-3">
          {rows.slice(0, 6).map((a) => {
            const Icon = iconByType(a.type);
            return (
              <div
                key={a.id}
                className="rounded-xl border border-gray-100 p-3 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {a.title || "Alerta"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {a.description || ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}
