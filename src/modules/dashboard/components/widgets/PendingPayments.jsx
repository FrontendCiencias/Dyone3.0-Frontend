import React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WidgetShell from "./WidgetShell";

function formatMoney(v) {
  const n = Number(v || 0);
  return `S/ ${n.toFixed(2)}`;
}

function formatDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

export default function PendingPayments({ rows = [] }) {
  const navigate = useNavigate();

  return (
    <WidgetShell
      title="Pagos por cobrar"
      subtitle="Pendientes y/o por vencer"
      right={
        <button
          type="button"
          onClick={() => navigate("/dashboard/payments")}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          Ir a Pagos <ArrowRight className="w-4 h-4 inline-block ml-1" />
        </button>
      }
    >
      {rows.length === 0 ? (
        <div className="text-sm text-gray-600">No hay pagos pendientes.</div>
      ) : (
        <div className="space-y-3">
          {rows.slice(0, 6).map((p) => (
            <div
              key={p.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {p.familyName || "Familia"}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {p.studentName ? `${p.studentName} • ` : ""}{p.concept || "Pensión"}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-gray-900">
                  {formatMoney(p.amount)}
                </div>
                <div className="text-xs text-gray-500">
                  Vence: {formatDateShort(p.dueDate)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
