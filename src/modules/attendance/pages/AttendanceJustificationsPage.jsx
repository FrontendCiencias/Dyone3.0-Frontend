import React from "react";
import { Gavel } from "lucide-react";
import { useRecentAttendanceJustificationsQuery } from "../hooks/useRecentAttendanceJustificationsQuery";

function formatDateLabel(value) {
  if (!value) return "-";
  const formatted = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T00:00:00`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AttendanceJustificationsPage() {
  const recentQuery = useRecentAttendanceJustificationsQuery({ limit: 20 });
  const items = Array.isArray(recentQuery.data?.items) ? recentQuery.data.items : [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Asistencia</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">Justificaciones</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Esta vista muestra las últimas justificaciones efectuadas por el auxiliar. La acción principal de justificar vive dentro del reporte mensual por alumno.
        </p>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Gavel className="h-4 w-4 text-violet-600" />
          Últimas justificaciones
        </div>

        {recentQuery.isLoading ? (
          <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            Cargando historial reciente…
          </div>
        ) : null}

        {recentQuery.error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
            No se pudo cargar el historial de justificaciones.
          </div>
        ) : null}

        {!recentQuery.isLoading && !items.length ? (
          <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            Aún no hay justificaciones registradas.
          </div>
        ) : null}

        {items.length ? (
          <div className="mt-5 grid gap-3">
            {items.map((item) => (
              <article key={item.recordId} className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-gray-950">{item?.student?.fullName || "-"}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {item?.student?.internalCode || "-"} · {item?.campus?.name || item?.campus?.code || "Campus"}
                    </div>
                  </div>
                  <div className="text-right text-xs text-violet-700">
                    <div className="font-semibold uppercase tracking-[0.18em]">
                      {item?.status === "ABSENT" ? "Falta justificada" : "Tardanza justificada"}
                    </div>
                    <div className="mt-1">{formatDateTime(item?.justifiedAt)}</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[0.6fr_1.4fr]">
                  <div className="rounded-2xl border border-violet-200 bg-white px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Día</div>
                    <div className="mt-2 text-sm font-semibold text-gray-950">{formatDateLabel(item?.date)}</div>
                  </div>
                  <div className="rounded-2xl border border-violet-200 bg-white px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Motivo</div>
                    <div className="mt-2 text-sm text-gray-700">{item?.justificationReason || "-"}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
