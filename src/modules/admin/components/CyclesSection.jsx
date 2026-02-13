import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import CreateModal from "./CreateModal";
import { useCyclesQuery } from "../hooks/useCyclesQuery";
import { useCreateCycleMutation } from "../hooks/useCreateCycleMutation";

function parseErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "Ocurrió un error inesperado.";
}

export default function CyclesSection({ canAccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState({
    type: "SCHOOL_YEAR",
    name: "",
    year: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const cyclesQuery = useCyclesQuery();
  const createMutation = useCreateCycleMutation();
  const rows = Array.isArray(cyclesQuery.data) ? cyclesQuery.data : [];

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.year || !form.startDate || !form.endDate) {
      setLocalError("Nombre, año y fechas son obligatorios.");
      return;
    }

    if (Number.isNaN(Number(form.year))) {
      setLocalError("El año debe ser numérico.");
      return;
    }

    setLocalError("");
    await createMutation.mutateAsync({ ...form, name: form.name.trim(), year: Number(form.year) });
    setIsOpen(false);
    setForm({ type: "SCHOOL_YEAR", name: "", year: "", startDate: "", endDate: "", isActive: true });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ciclos</h3>
          <p className="text-sm text-gray-600">Administra periodos académicos y ciclos especiales.</p>
        </div>
        {canAccess && <Button onClick={() => setIsOpen(true)}>+ Crear</Button>}
      </div>

      {!canAccess && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">No tienes permisos para esta sección.</p>}

      {canAccess && cyclesQuery.isError && (
        <p className="mb-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{parseErrorMessage(cyclesQuery.error)}</p>
      )}

      {canAccess && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-700">
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Año</th>
                <th className="px-3 py-2">Inicio</th>
                <th className="px-3 py-2">Fin</th>
                <th className="px-3 py-2">Activo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((cycle) => (
                <tr key={cycle.id || `${cycle.type}-${cycle.year}-${cycle.name}`} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{cycle.type || "-"}</td>
                  <td className="px-3 py-2">{cycle.name || "-"}</td>
                  <td className="px-3 py-2">{cycle.year || "-"}</td>
                  <td className="px-3 py-2">{cycle.startDate?.slice?.(0, 10) || "-"}</td>
                  <td className="px-3 py-2">{cycle.endDate?.slice?.(0, 10) || "-"}</td>
                  <td className="px-3 py-2">{cycle.isActive ? "Sí" : "No"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={6}>
                    {cyclesQuery.isLoading ? "Cargando..." : "Sin registros"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CreateModal
        title="Crear ciclo"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isSubmitting={createMutation.isPending}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              <option value="SCHOOL_YEAR">SCHOOL_YEAR</option>
              <option value="SUMMER">SUMMER</option>
              <option value="PRE_U">PRE_U</option>
            </select>
          </div>
          <Input label="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Año" type="number" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} />
          <Input label="Inicio" type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
          <Input label="Fin" type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
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
