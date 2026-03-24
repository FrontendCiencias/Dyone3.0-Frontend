import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../../lib/auth";
import { useCampusesQuery } from "../hooks/useCampusesQuery";
import { useCyclesQuery } from "../hooks/useCyclesQuery";
import { downloadCajaArequipaExport } from "../services/admin.service";

function parseErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "No se pudo generar el archivo de exportacion.";
}

function getEntityId(entity) {
  return String(entity?.id || entity?._id || "");
}

function campusOptionValue(campus) {
  return String(campus?.code || "").toUpperCase();
}

export default function CajaArequipaExportSection({ canAccess }) {
  const { activeCampus, campusScope } = useAuth();
  const campusesQuery = useCampusesQuery();
  const cyclesQuery = useCyclesQuery();

  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const availableCampuses = useMemo(() => {
    const rows = Array.isArray(campusesQuery.data) ? campusesQuery.data : [];
    const allowed = Array.isArray(campusScope) ? campusScope.map((code) => String(code).toUpperCase()) : [];
    if (!allowed.length || allowed.includes("ALL")) return rows;
    return rows.filter((campus) => allowed.includes(campusOptionValue(campus)));
  }, [campusesQuery.data, campusScope]);

  const availableCycles = useMemo(() => {
    const rows = Array.isArray(cyclesQuery.data) ? cyclesQuery.data : [];
    return [...rows].sort((a, b) => {
      if (Boolean(b.isActive) !== Boolean(a.isActive)) return Number(Boolean(b.isActive)) - Number(Boolean(a.isActive));
      return Number(b.year || 0) - Number(a.year || 0);
    });
  }, [cyclesQuery.data]);

  useEffect(() => {
    if (!availableCampuses.length) return;
    if (selectedCampus && availableCampuses.some((campus) => campusOptionValue(campus) === selectedCampus)) return;

    const preferredCampus = String(activeCampus || "").toUpperCase();
    const nextCampus = availableCampuses.some((campus) => campusOptionValue(campus) === preferredCampus)
      ? preferredCampus
      : "";
    setSelectedCampus(nextCampus);
  }, [availableCampuses, activeCampus, selectedCampus]);

  useEffect(() => {
    if (!availableCycles.length) return;
    if (selectedCycleId && availableCycles.some((cycle) => getEntityId(cycle) === selectedCycleId)) return;

    const activeCycle = availableCycles.find((cycle) => cycle.isActive) || availableCycles[0];
    setSelectedCycleId(getEntityId(activeCycle));
  }, [availableCycles, selectedCycleId]);

  const handleDownload = async () => {
    setIsDownloading(true);
    setFeedback({ type: "", message: "" });
    try {
      const result = await downloadCajaArequipaExport({
        ...(selectedCampus ? { campus: selectedCampus } : {}),
        ...(selectedCycleId ? { cycleId: selectedCycleId } : {}),
      });

      const rowLabel = result.rowCount === 1 ? "1 alumno exportado." : `${result.rowCount} alumnos exportados.`;
      setFeedback({
        type: "success",
        message: `${rowLabel} Archivo: ${result.fileName}`,
      });
    } catch (error) {
      setFeedback({ type: "error", message: parseErrorMessage(error) });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Exportacion Caja Arequipa</h3>
          <p className="text-sm text-gray-600">
            Descarga un CSV con alumnos, grado actual y codigo Caja Arequipa para compartirlo con el banco.
          </p>
        </div>
      </div>

      {!canAccess && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          No tienes permisos para esta seccion.
        </p>
      )}

      {canAccess && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Sede</label>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={selectedCampus}
                onChange={(event) => setSelectedCampus(event.target.value)}
              >
                <option value="">Todos los campus permitidos</option>
                {availableCampuses.map((campus) => (
                  <option key={campus.id || campus.code} value={campusOptionValue(campus)}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Ciclo</label>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={selectedCycleId}
                onChange={(event) => setSelectedCycleId(event.target.value)}
              >
                {availableCycles.map((cycle) => (
                  <option key={getEntityId(cycle) || `${cycle.name}-${cycle.year}`} value={getEntityId(cycle)}>
                    {cycle.name} ({cycle.year}){cycle.isActive ? " - Activo" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-sm text-gray-600">
              Se exportaran apellidos y nombres, grado actual y codigo Caja Arequipa si ya existe.
            </div>
            <Button
              onClick={handleDownload}
              disabled={isDownloading || campusesQuery.isLoading || cyclesQuery.isLoading || !selectedCycleId}
            >
              {isDownloading ? "Generando..." : "Descargar CSV"}
            </Button>
          </div>

          {feedback.type === "success" && (
            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{feedback.message}</p>
          )}
          {feedback.type === "error" && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{feedback.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
