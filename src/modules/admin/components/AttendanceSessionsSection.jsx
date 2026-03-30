import React, { useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import { useCampusesQuery } from "../hooks/useCampusesQuery";
import { useCyclesQuery } from "../hooks/useCyclesQuery";
import { useAdminAttendanceSessionsQuery } from "../hooks/useAdminAttendanceSessionsQuery";
import { useDeleteAdminAttendanceSessionMutation } from "../hooks/useDeleteAdminAttendanceSessionMutation";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "OPEN", label: "Abierta" },
  { value: "CLOSED", label: "Cerrada" },
  { value: "CANCELLED", label: "Cancelada" },
];

function getRows(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

function parseErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "Ocurrió un error inesperado.";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeFilters(filters) {
  const normalized = {
    limit: Number(filters?.limit || 80),
  };
  if (filters?.campusId) normalized.campusId = filters.campusId;
  if (filters?.cycleId) normalized.cycleId = filters.cycleId;
  if (filters?.status) normalized.status = filters.status;
  if (filters?.dateFrom) normalized.dateFrom = filters.dateFrom;
  if (filters?.dateTo) normalized.dateTo = filters.dateTo;
  return normalized;
}

export default function AttendanceSessionsSection({ canAccess }) {
  const [filters, setFilters] = useState({
    campusId: "",
    cycleId: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    limit: 80,
  });
  const [localError, setLocalError] = useState("");

  const campusesQuery = useCampusesQuery();
  const cyclesQuery = useCyclesQuery();
  const campusRows = useMemo(() => getRows(campusesQuery.data), [campusesQuery.data]);
  const cycleRows = useMemo(() => getRows(cyclesQuery.data), [cyclesQuery.data]);
  const normalizedFilters = useMemo(() => normalizeFilters(filters), [filters]);
  const sessionsQuery = useAdminAttendanceSessionsQuery(normalizedFilters, canAccess);
  const deleteMutation = useDeleteAdminAttendanceSessionMutation();

  const rows = useMemo(() => getRows(sessionsQuery.data), [sessionsQuery.data]);

  const handleDelete = async (session) => {
    const confirmed = window.confirm(
      `Se eliminará la sesión del ${formatDate(session?.date)} y todos sus registros de asistencia. Esta acción no se puede deshacer.\n\n¿Deseas continuar?`
    );
    if (!confirmed) return;

    setLocalError("");
    try {
      await deleteMutation.mutateAsync(session.id);
    } catch (error) {
      setLocalError(parseErrorMessage(error));
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Sesiones de asistencia</h3>
        <p className="text-sm text-gray-600">Elimina sesiones creadas por error. Solo disponible para administradores.</p>
      </div>

      {!canAccess ? <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">No tienes permisos para esta sección.</p> : null}

      {canAccess ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-6">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Campus</label>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={filters.campusId}
                onChange={(event) => setFilters((prev) => ({ ...prev, campusId: event.target.value }))}
              >
                <option value="">Todos</option>
                {campusRows.map((campus) => (
                  <option key={campus.id || campus._id || campus.code} value={campus.id || campus._id}>
                    {campus.name || campus.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Ciclo</label>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={filters.cycleId}
                onChange={(event) => setFilters((prev) => ({ ...prev, cycleId: event.target.value }))}
              >
                <option value="">Todos</option>
                {cycleRows.map((cycle) => (
                  <option key={cycle.id || cycle._id || cycle.name} value={cycle.id || cycle._id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.label} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Desde</label>
              <input
                type="date"
                className="rounded border px-3 py-2 text-sm"
                value={filters.dateFrom}
                onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Hasta</label>
              <input
                type="date"
                className="rounded border px-3 py-2 text-sm"
                value={filters.dateTo}
                onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => sessionsQuery.refetch()}
                disabled={sessionsQuery.isFetching}
              >
                Actualizar
              </Button>
            </div>
          </div>

          {localError ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{localError}</p> : null}
          {sessionsQuery.isError ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{parseErrorMessage(sessionsQuery.error)}</p> : null}

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Fecha</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Campus</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Ciclo</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Estado</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Registros</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Apertura / Cierre</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 text-sm text-gray-700">{formatDate(row.date)}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{row?.campus?.name || row?.campus?.code || "-"}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{row?.cycle?.name || "-"}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{row?.status || "-"}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{Number(row?.records?.recordsCount || 0)}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      <div>Apertura: {formatDateTime(row.openedAt)}</div>
                      <div>Cierre: {formatDateTime(row.closedAt)}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDelete(row)}
                        disabled={deleteMutation.isPending}
                      >
                        Eliminar sesión
                      </Button>
                    </td>
                  </tr>
                ))}
                {!rows.length && !sessionsQuery.isLoading ? (
                  <tr>
                    <td className="px-3 py-4 text-sm text-gray-500" colSpan={7}>
                      No hay sesiones de asistencia para los filtros seleccionados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
