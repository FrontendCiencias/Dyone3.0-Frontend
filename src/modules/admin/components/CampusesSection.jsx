import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import CreateModal from "./CreateModal";
import { useCampusesQuery } from "../hooks/useCampusesQuery";
import { useCreateCampusMutation } from "../hooks/useCreateCampusMutation";

function parseErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "Ocurrió un error inesperado.";
}

export default function CampusesSection({ canAccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", isActive: true });
  const [localError, setLocalError] = useState("");

  const campusesQuery = useCampusesQuery();
  const createMutation = useCreateCampusMutation();

  const rows = Array.isArray(campusesQuery.data) ? campusesQuery.data : [];

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setLocalError("Código y nombre son obligatorios.");
      return;
    }

    setLocalError("");
    await createMutation.mutateAsync({ ...form, code: form.code.trim(), name: form.name.trim() });
    setIsOpen(false);
    setForm({ code: "", name: "", isActive: true });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sedes</h3>
          <p className="text-sm text-gray-600">Gestiona las sedes disponibles para matrículas.</p>
        </div>
        {canAccess && <Button onClick={() => setIsOpen(true)}>+ Crear</Button>}
      </div>

      {!canAccess && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">No tienes permisos para esta sección.</p>}

      {canAccess && campusesQuery.isError && (
        <p className="mb-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{parseErrorMessage(campusesQuery.error)}</p>
      )}

      {canAccess && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-700">
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Activo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((campus) => (
                <tr key={campus.id || campus.code} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{campus.code || "-"}</td>
                  <td className="px-3 py-2">{campus.name || "-"}</td>
                  <td className="px-3 py-2">{campus.isActive ? "Sí" : "No"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={3}>
                    {campusesQuery.isLoading ? "Cargando..." : "Sin registros"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CreateModal
        title="Crear sede"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isSubmitting={createMutation.isPending}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Código" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
          <Input label="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
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
