import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import CreateModal from "./CreateModal";
import { useBillingConceptsQuery } from "../hooks/useBillingConceptsQuery";
import { useCreateBillingConceptMutation } from "../hooks/useCreateBillingConceptMutation";

function parseErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "Ocurrió un error inesperado.";
}

export default function BillingConceptsSection({ canAccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState({ name: "", isBlocking: false, isActive: true });

  const conceptsQuery = useBillingConceptsQuery();
  const createMutation = useCreateBillingConceptMutation();
  const rows = Array.isArray(conceptsQuery.data) ? conceptsQuery.data : [];

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setLocalError("El nombre es obligatorio.");
      return;
    }

    setLocalError("");
    await createMutation.mutateAsync({ ...form, name: form.name.trim() });
    setIsOpen(false);
    setForm({ name: "", isBlocking: false, isActive: true });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Conceptos de Cobro</h3>
          <p className="text-sm text-gray-600">Configura conceptos para pensiones, matrículas y otros cobros.</p>
        </div>
        {canAccess && <Button onClick={() => setIsOpen(true)}>+ Crear</Button>}
      </div>

      {!canAccess && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">No tienes permisos para esta sección.</p>}

      {canAccess && conceptsQuery.isError && (
        <p className="mb-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{parseErrorMessage(conceptsQuery.error)}</p>
      )}

      {canAccess && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-700">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Bloqueante</th>
                <th className="px-3 py-2">Activo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((concept) => (
                <tr key={concept.id || concept.name} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{concept.name || "-"}</td>
                  <td className="px-3 py-2">{concept.isBlocking ? "Sí" : "No"}</td>
                  <td className="px-3 py-2">{concept.isActive ? "Sí" : "No"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={3}>
                    {conceptsQuery.isLoading ? "Cargando..." : "Sin registros"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CreateModal
        title="Crear concepto de cobro"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isSubmitting={createMutation.isPending}
        onSubmit={handleSubmit}
      >
        <Input label="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isBlocking}
            onChange={(e) => setForm((p) => ({ ...p, isBlocking: e.target.checked }))}
          />
          Es bloqueante
        </label>

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
