import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { ROUTES } from "../../../config/routes";
import { useCyclesQuery } from "../hooks/useCyclesQuery";
import { createProgram, getPrograms } from "../services/admin.service";

function getErrorMessage(error, fallback) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return fallback;
}

export default function ProgramsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", notes: "" });
  const [error, setError] = useState("");

  const cyclesQuery = useCyclesQuery();

  const programsQuery = useQuery({
    queryKey: ["admin", "programs"],
    queryFn: getPrograms,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const cycleItems = Array.isArray(cyclesQuery.data) ? cyclesQuery.data : [];
  const programs = Array.isArray(programsQuery.data?.items) ? programsQuery.data.items : [];

  const activeCycle = useMemo(() => {
    return cycleItems.find((cycle) => cycle.isActive) || cycleItems[0] || null;
  }, [cycleItems]);

  const createMutation = useMutation({
    mutationFn: createProgram,
    onSuccess: async (created) => {
      setForm({ name: "", notes: "" });
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
      const nextId = created?._id || created?.id;
      if (nextId) navigate(ROUTES.dashboardProgramDetail(nextId));
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError, "No se pudo crear el programa")),
  });

  function handleCreate() {
    if (!form.name.trim()) {
      setError("Ingresa un nombre para el programa.");
      return;
    }

    if (!activeCycle?._id) {
      setError("Falta un ciclo activo.");
      return;
    }

    createMutation.mutate({
      name: form.name.trim(),
      notes: form.notes.trim(),
      cycleId: activeCycle._id,
    });
  }

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900">Crear programa</h2>
            <p className="mt-1 text-sm text-gray-600">
              Pantalla inicial para registrar programas. La operación diaria se realiza dentro del detalle del programa.
            </p>

            <div className="mt-4 space-y-3">
              <Input
                label="Nombre del programa"
                value={form.name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                  setError("");
                }}
                placeholder="Ej: Taller de matemática"
              />

              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-700">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, notes: e.target.value }));
                    setError("");
                  }}
                  rows={4}
                  className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                  placeholder="Descripción breve"
                />
              </div>

              <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                El programa será agnóstico al campus. Solo quedará asociado al ciclo {activeCycle?.name || "-"}.
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
                Crear programa
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900">Programas creados</h2>
            <p className="mt-1 text-sm text-gray-600">
              Entra al detalle para iniciar sesiones, tomar asistencia, registrar pagos y agregar alumnos.
            </p>

            <div className="mt-4 space-y-3">
              {programs.map((program) => (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => navigate(ROUTES.dashboardProgramDetail(program.id))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">{program.name}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {program.cycle?.name || "-"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{program.studentsCount} alumno(s)</p>
                </button>
              ))}

              {!programs.length ? (
                <p className="text-sm text-gray-500">Todavía no hay programas registrados.</p>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
