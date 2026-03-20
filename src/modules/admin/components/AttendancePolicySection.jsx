import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import CreateModal from "./CreateModal";
import { useCampusesQuery } from "../hooks/useCampusesQuery";
import { useCyclesQuery } from "../hooks/useCyclesQuery";
import { useAttendancePolicyQuery } from "../hooks/useAttendancePolicyQuery";
import { useUpsertAttendancePolicyMutation } from "../hooks/useUpsertAttendancePolicyMutation";

const LEVELS = [
  { value: "INITIAL", label: "Inicial" },
  { value: "PRIMARY", label: "Primaria" },
  { value: "SECONDARY", label: "Secundaria" },
];

function getCycleRows(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

function getCampusRows(data) {
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

function LevelPolicyCard({ campus, cycleId, level, canAccess, onConfigure }) {
  const campusId = campus?.id || campus?._id || "";
  const policyQuery = useAttendancePolicyQuery({
    campusId,
    cycleId,
    level: level.value,
    enabled: Boolean(canAccess && campusId && cycleId),
  });
  const item = policyQuery.data?.item || null;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{level.label}</div>
          <div className="mt-2 text-base font-semibold text-gray-900">{item?.name || "Sin horario configurado"}</div>
        </div>
        {canAccess ? (
          <Button size="sm" onClick={() => onConfigure(campus, level, item)}>
            Configurar
          </Button>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Temprano hasta</div>
        <div className="mt-1 text-base font-semibold text-gray-900">{item?.defaultOnTimeUntil || "--:--"}</div>
      </div>

      {policyQuery.isError ? (
        <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{parseErrorMessage(policyQuery.error)}</p>
      ) : null}
    </div>
  );
}

export default function AttendancePolicySection({ canAccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState({
    campusId: "",
    cycleId: "",
    level: "INITIAL",
    name: "Asistencia regular",
    defaultOnTimeUntil: "07:50",
    notes: "",
  });

  const campusesQuery = useCampusesQuery();
  const cyclesQuery = useCyclesQuery();
  const upsertMutation = useUpsertAttendancePolicyMutation();

  const campusRows = useMemo(() => getCampusRows(campusesQuery.data), [campusesQuery.data]);
  const cycleRows = useMemo(() => getCycleRows(cyclesQuery.data), [cyclesQuery.data]);
  const activeCycle = useMemo(() => cycleRows.find((row) => row?.isActive) || cycleRows[0] || null, [cycleRows]);
  const selectedCampusId = form.campusId || campusRows[0]?.id || campusRows[0]?._id || "";
  const selectedCycleId = form.cycleId || activeCycle?.id || activeCycle?._id || "";

  useEffect(() => {
    if (!form.campusId && campusRows[0]) {
      const campus = campusRows[0];
      setForm((prev) => ({ ...prev, campusId: campus.id || campus._id || "" }));
    }
  }, [campusRows, form.campusId]);

  useEffect(() => {
    if (!form.cycleId && activeCycle) {
      setForm((prev) => ({ ...prev, cycleId: activeCycle.id || activeCycle._id || "" }));
    }
  }, [activeCycle, form.cycleId]);

  const handleOpen = (campus, level, item = null) => {
    setLocalError("");
    setForm({
      campusId: item?.campusId || campus?.id || campus?._id || "",
      cycleId: item?.cycleId || selectedCycleId,
      level: item?.level || level?.value || "INITIAL",
      name: item?.name || `Asistencia ${level?.label || "regular"}`,
      defaultOnTimeUntil: item?.defaultOnTimeUntil || "07:50",
      notes: item?.notes || "",
    });
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.campusId || !form.cycleId || !form.defaultOnTimeUntil) {
      setLocalError("Campus, ciclo y horario obligatorios.");
      return;
    }

    setLocalError("");
    const result = await upsertMutation.mutateAsync({
      campusId: form.campusId,
      cycleId: form.cycleId,
      level: form.level,
      name: form.name.trim() || "Asistencia regular",
      defaultOnTimeUntil: form.defaultOnTimeUntil,
      notes: form.notes.trim(),
    });
    const saved = result?.item;
    if (saved) {
      setForm((prev) => ({
        ...prev,
        campusId: saved.campusId || prev.campusId,
        cycleId: saved.cycleId || prev.cycleId,
        level: saved.level || prev.level,
        name: saved.name || prev.name,
        defaultOnTimeUntil: saved.defaultOnTimeUntil || prev.defaultOnTimeUntil,
        notes: saved.notes || "",
      }));
    }
    setIsOpen(false);
  };

  const selectedCampus = campusRows.find((row) => String(row.id || row._id) === String(selectedCampusId));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Horario de asistencia</h3>
          <p className="text-sm text-gray-600">Define la hora base por nivel para cada campus. El auxiliar usará esa regla al marcar asistencia.</p>
        </div>
      </div>

      {!canAccess && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">No tienes permisos para esta sección.</p>}

      {canAccess && (
        <div className="space-y-3">
          {campusRows.map((campus) => (
            <div key={campus.id || campus._id || campus.code} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-4">
                <div className="text-lg font-semibold text-gray-900">{campus?.name || "-"}</div>
                <div className="text-sm text-gray-500">{campus?.code || "-"}</div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {LEVELS.map((level) => (
                  <LevelPolicyCard
                    key={`${campus.id || campus._id || campus.code}-${level.value}`}
                    campus={campus}
                    cycleId={selectedCycleId}
                    level={level}
                    canAccess={canAccess}
                    onConfigure={handleOpen}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateModal
        title="Configurar horario de asistencia"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isSubmitting={upsertMutation.isPending}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Campus</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={form.campusId}
              onChange={(event) => setForm((prev) => ({ ...prev, campusId: event.target.value }))}
            >
              {campusRows.map((campus) => (
                <option key={campus.id || campus._id || campus.code} value={campus.id || campus._id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Ciclo</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={form.cycleId}
              onChange={(event) => setForm((prev) => ({ ...prev, cycleId: event.target.value }))}
            >
              {cycleRows.map((cycle) => (
                <option key={cycle.id || cycle._id || cycle.name} value={cycle.id || cycle._id}>
                  {cycle.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Nivel</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={form.level}
              onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}
            >
              {LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Temprano hasta" type="time" value={form.defaultOnTimeUntil} onChange={(e) => setForm((p) => ({ ...p, defaultOnTimeUntil: e.target.value }))} />
        </div>

        <Input label="Notas" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />

        {localError && <p className="text-sm text-red-600">{localError}</p>}
        {upsertMutation.isError && <p className="text-sm text-red-600">{parseErrorMessage(upsertMutation.error)}</p>}
      </CreateModal>
    </div>
  );
}
