import React, { useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import CreateModal from "./CreateModal";
import { useClassroomsQuery } from "../hooks/useClassroomsQuery";
import { useCreateClassroomMutation } from "../hooks/useCreateClassroomMutation";
import { useCampusesQuery } from "../hooks/useCampusesQuery";
import { useCyclesQuery } from "../hooks/useCyclesQuery";

function parseErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "Ocurrió un error inesperado.";
}

export default function ClassroomsSection({ canAccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localError, setLocalError] = useState("");

  const campusesQuery = useCampusesQuery();
  const cyclesQuery = useCyclesQuery();
  const classroomsQuery = useClassroomsQuery();
  const createMutation = useCreateClassroomMutation();

  const campuses = useMemo(() => (Array.isArray(campusesQuery.data) ? campusesQuery.data : []), [campusesQuery.data]);
  const cycles = useMemo(() => (Array.isArray(cyclesQuery.data) ? cyclesQuery.data : []), [cyclesQuery.data]);

  const [form, setForm] = useState({
    campusId: "",
    cycleId: "",
    level: "",
    grade: "",
    section: "",
    capacity: "",
    displayName: "",
    isActive: true,
  });

  const rows = Array.isArray(classroomsQuery.data) ? classroomsQuery.data : [];

  const handleSubmit = async () => {
    if (!form.campusId || !form.cycleId || !form.level.trim() || !form.grade.trim() || !form.section.trim()) {
      setLocalError("Campus, ciclo, nivel, grado y sección son obligatorios.");
      return;
    }

    if (Number.isNaN(Number(form.capacity))) {
      setLocalError("La capacidad debe ser numérica.");
      return;
    }

    setLocalError("");
    await createMutation.mutateAsync({
      ...form,
      capacity: Number(form.capacity),
      level: form.level.trim(),
      grade: form.grade.trim(),
      section: form.section.trim(),
      displayName: form.displayName.trim(),
    });

    setIsOpen(false);
    setForm({
      campusId: "",
      cycleId: "",
      level: "",
      grade: "",
      section: "",
      capacity: "",
      displayName: "",
      isActive: true,
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Aulas</h3>
          <p className="text-sm text-gray-600">Asigna aulas por sede, ciclo, nivel y sección.</p>
        </div>
        {canAccess && <Button onClick={() => setIsOpen(true)}>+ Crear</Button>}
      </div>

      {!canAccess && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">No tienes permisos para esta sección.</p>}

      {canAccess && classroomsQuery.isError && (
        <p className="mb-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{parseErrorMessage(classroomsQuery.error)}</p>
      )}

      {canAccess && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-700">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Nivel</th>
                <th className="px-3 py-2">Grado</th>
                <th className="px-3 py-2">Sección</th>
                <th className="px-3 py-2">Capacidad</th>
                <th className="px-3 py-2">Activo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((classroom) => (
                <tr key={classroom.id || classroom.displayName} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{classroom.displayName || "-"}</td>
                  <td className="px-3 py-2">{classroom.level || "-"}</td>
                  <td className="px-3 py-2">{classroom.grade || "-"}</td>
                  <td className="px-3 py-2">{classroom.section || "-"}</td>
                  <td className="px-3 py-2">{classroom.capacity ?? "-"}</td>
                  <td className="px-3 py-2">{classroom.isActive ? "Sí" : "No"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={6}>
                    {classroomsQuery.isLoading ? "Cargando..." : "Sin registros"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CreateModal
        title="Crear aula"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isSubmitting={createMutation.isPending}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Sede</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={form.campusId}
              onChange={(e) => setForm((p) => ({ ...p, campusId: e.target.value }))}
            >
              <option value="">Selecciona</option>
              {campuses.map((campus) => (
                <option key={campus.id || campus.code} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Ciclo</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={form.cycleId}
              onChange={(e) => setForm((p) => ({ ...p, cycleId: e.target.value }))}
            >
              <option value="">Selecciona</option>
              {cycles.map((cycle) => (
                <option key={cycle.id || `${cycle.name}-${cycle.year}`} value={cycle.id}>
                  {cycle.name} ({cycle.year})
                </option>
              ))}
            </select>
          </div>

          <Input label="Nivel" value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} />
          <Input label="Grado" value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} />
          <Input label="Sección" value={form.section} onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))} />
          <Input
            label="Capacidad"
            type="number"
            value={form.capacity}
            onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
          />
          <Input
            label="Nombre visible"
            value={form.displayName}
            onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
            className="md:col-span-2"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
          />
          Activo
        </label>

        {localError && <p className="text-sm text-red-600">{localError}</p>}
        {createMutation.isError && <p className="text-sm text-red-600">{parseErrorMessage(createMutation.error)}</p>}
        {createMutation.isSuccess && <p className="text-sm text-emerald-600">Creado.</p>}
      </CreateModal>
    </div>
  );
}
