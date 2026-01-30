import React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WidgetShell from "./WidgetShell";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function RecentEnrollments({ rows = [] }) {
  const navigate = useNavigate();

  return (
    <WidgetShell
      title="Matrículas recientes"
      subtitle="Últimos registros creados"
      right={
        <button
          type="button"
          onClick={() => navigate("/dashboard/enrollments")}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          Ver todo <ArrowRight className="w-4 h-4 inline-block ml-1" />
        </button>
      }
    >
      {rows.length === 0 ? (
        <div className="text-sm text-gray-600">Aún no hay matrículas recientes.</div>
      ) : (
        <div className="space-y-3">
          {rows.slice(0, 6).map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {r.studentName || "Alumno"}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {r.familyName ? `${r.familyName} • ` : ""}{r.gradeLabel || "—"}
                </div>
              </div>

              <div className="text-xs text-gray-400 flex-shrink-0">
                {formatDate(r.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
