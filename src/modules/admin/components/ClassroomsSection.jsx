import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import CreateModal from "./CreateModal";
import { useClassroomsQuery } from "../hooks/useClassroomsQuery";
import { useCreateClassroomMutation } from "../hooks/useCreateClassroomMutation";
import { useUpdateClassroomMutation } from "../hooks/useUpdateClassroomMutation";
import { useCampusesQuery } from "../hooks/useCampusesQuery";
import { useCyclesQuery } from "../hooks/useCyclesQuery";

function parseErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "Ocurrio un error inesperado.";
}

function buildDefaultForm() {
  return {
    campusId: "",
    cycleId: "",
    level: "",
    grade: "",
    section: "",
    capacity: "",
    displayName: "",
    isActive: true,
    notes: "",
  };
}

function mapClassroomToForm(classroom) {
  return {
    campusId: classroom?.campusId?._id || classroom?.campusId || "",
    cycleId: classroom?.cycleId?._id || classroom?.cycleId || "",
    level: classroom?.level || "",
    grade: classroom?.grade || "",
    section: classroom?.section || "",
    capacity: classroom?.capacity ?? "",
    displayName: classroom?.displayName || "",
    isActive: Boolean(classroom?.isActive),
    notes: classroom?.notes || "",
  };
}

function ClassroomFormFields({ campuses, cycles, form, setForm }) {
  return (
    <>
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
              <option key={cycle.id || cycle._id || `${cycle.name}-${cycle.year}`} value={cycle.id || cycle._id}>
                {cycle.name} ({cycle.year})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Nivel</label>
          <select
            className="rounded border px-3 py-2 text-sm"
            value={form.level}
            onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
          >
            <option value="">Selecciona</option>
            <option value="INITIAL">Inicial</option>
            <option value="PRIMARY">Primaria</option>
            <option value="SECONDARY">Secundaria</option>
          </select>
        </div>

        <Input label="Grado" value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} />
        <Input label="Seccion" value={form.section} onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))} />
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

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Notas</label>
        <textarea
          className="min-h-24 rounded border px-3 py-2 text-sm"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
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
    </>
  );
}

export default function ClassroomsSection({ canAccess }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState(buildDefaultForm());

  const campusesQuery = useCampusesQuery();
  const cyclesQuery = useCyclesQuery();
  const classroomsQuery = useClassroomsQuery();
  const createMutation = useCreateClassroomMutation();
  const updateMutation = useUpdateClassroomMutation();

  const campuses = useMemo(() => (Array.isArray(campusesQuery.data) ? campusesQuery.data : []), [campusesQuery.data]);
  const cycles = useMemo(() => (Array.isArray(cyclesQuery.data) ? cyclesQuery.data : []), [cyclesQuery.data]);
  const rows = Array.isArray(classroomsQuery.data) ? classroomsQuery.data : [];

  useEffect(() => {
    if (isCreateOpen) {
      setForm(buildDefaultForm());
      setLocalError("");
    }
  }, [isCreateOpen]);

  useEffect(() => {
    if (editingClassroom) {
      setForm(mapClassroomToForm(editingClassroom));
      setLocalError("");
    }
  }, [editingClassroom]);

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setLocalError("");
    createMutation.reset();
  };

  const handleCloseEdit = () => {
    setEditingClassroom(null);
    setLocalError("");
    updateMutation.reset();
  };

  const normalizePayload = () => ({
    ...form,
    capacity: Number(form.capacity),
    level: form.level.trim(),
    grade: form.grade.trim(),
    section: form.section.trim(),
    displayName: form.displayName.trim(),
    notes: form.notes.trim(),
  });

  const validateForm = () => {
    if (!form.campusId || !form.cycleId || !form.level.trim() || !form.grade.trim() || !form.section.trim()) {
      return "Campus, ciclo, nivel, grado y seccion son obligatorios.";
    }

    if (Number.isNaN(Number(form.capacity))) {
      return "La capacidad debe ser numerica.";
    }

    return "";
  };

  const handleSubmitCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError("");
    await createMutation.mutateAsync(normalizePayload());
    handleCloseCreate();
  };

  const handleSubmitEdit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError("");
    await updateMutation.mutateAsync({
      classroomId: editingClassroom.id || editingClassroom._id,
      payload: normalizePayload(),
    });
    handleCloseEdit();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Aulas</h3>
          <p className="text-sm text-gray-600">Haz click en una fila para editar el salon completo.</p>
        </div>
        {canAccess && <Button onClick={() => setIsCreateOpen(true)}>+ Crear</Button>}
      </div>

      {!canAccess && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">No tienes permisos para esta seccion.</p>}

      {canAccess && classroomsQuery.isError && (
        <p className="mb-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{parseErrorMessage(classroomsQuery.error)}</p>
      )}

      {canAccess && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-700">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Sede</th>
                <th className="px-3 py-2">Ciclo</th>
                <th className="px-3 py-2">Nivel</th>
                <th className="px-3 py-2">Grado</th>
                <th className="px-3 py-2">Seccion</th>
                <th className="px-3 py-2">Capacidad</th>
                <th className="px-3 py-2">Activo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((classroom) => (
                <tr
                  key={classroom.id || classroom._id || classroom.displayName}
                  className="cursor-pointer border-b transition hover:bg-gray-50 last:border-b-0"
                  onClick={() => setEditingClassroom(classroom)}
                >
                  <td className="px-3 py-2 font-medium text-gray-900">{classroom.displayName || "-"}</td>
                  <td className="px-3 py-2">{classroom.campusId?.name || "-"}</td>
                  <td className="px-3 py-2">{classroom.cycleId?.name || "-"}</td>
                  <td className="px-3 py-2">{classroom.level || "-"}</td>
                  <td className="px-3 py-2">{classroom.grade || "-"}</td>
                  <td className="px-3 py-2">{classroom.section || "-"}</td>
                  <td className="px-3 py-2">{classroom.capacity ?? "-"}</td>
                  <td className="px-3 py-2">{classroom.isActive ? "Si" : "No"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={8}>
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
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        isSubmitting={createMutation.isPending}
        onSubmit={handleSubmitCreate}
        submitLabel="Crear"
      >
        <ClassroomFormFields campuses={campuses} cycles={cycles} form={form} setForm={setForm} />
        {localError && <p className="text-sm text-red-600">{localError}</p>}
        {createMutation.isError && <p className="text-sm text-red-600">{parseErrorMessage(createMutation.error)}</p>}
        {createMutation.isSuccess && <p className="text-sm text-emerald-600">Creado.</p>}
      </CreateModal>

      <CreateModal
        title="Editar aula"
        isOpen={Boolean(editingClassroom)}
        onClose={handleCloseEdit}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmitEdit}
        submitLabel="Guardar cambios"
      >
        <ClassroomFormFields campuses={campuses} cycles={cycles} form={form} setForm={setForm} />
        {localError && <p className="text-sm text-red-600">{localError}</p>}
        {updateMutation.isError && <p className="text-sm text-red-600">{parseErrorMessage(updateMutation.error)}</p>}
        {updateMutation.isSuccess && <p className="text-sm text-emerald-600">Guardado.</p>}
      </CreateModal>
    </div>
  );
}
