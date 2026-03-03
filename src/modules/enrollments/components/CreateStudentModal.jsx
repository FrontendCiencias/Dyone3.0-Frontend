import React, { useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";

const INITIAL = { names: "", lastNames: "", dni: "", level: "", grade: "", previousSchoolType: "OTHER" };

export default function CreateStudentModal({ open, onClose, onSubmit, isSubmitting = false }) {
  const [form, setForm] = useState(INITIAL);

  const canSubmit = useMemo(
    () => form.names.trim() && form.lastNames.trim() && form.level.trim() && form.grade.trim() && !isSubmitting,
    [form, isSubmitting],
  );

  const submit = async () => {
    await onSubmit?.({
      names: form.names.trim(),
      lastNames: form.lastNames.trim(),
      dni: form.dni.trim() || undefined,
      level: form.level.trim().toUpperCase(),
      grade: form.grade.trim().toUpperCase(),
      previousSchoolType: form.previousSchoolType,
    });
    setForm(INITIAL);
  };

  return (
    <BaseModal
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      title="Nuevo alumno"
      footer={(
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isSubmitting}>Cancelar</SecondaryButton>
          <Button onClick={submit} disabled={!canSubmit}>{isSubmitting ? "Guardando..." : "Crear"}</Button>
        </div>
      )}
    >
      <div className="space-y-2 p-5">
        <Input label="Nombres" value={form.names} onChange={(e) => setForm((p) => ({ ...p, names: e.target.value }))} />
        <Input label="Apellidos" value={form.lastNames} onChange={(e) => setForm((p) => ({ ...p, lastNames: e.target.value }))} />
        <Input label="DNI" value={form.dni} onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))} />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input label="Nivel" value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} placeholder="PRIMARIA" />
          <Input label="Grado" value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} placeholder="3" />
        </div>
        <label className="text-sm text-gray-700">Colegio anterior</label>
        <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={form.previousSchoolType} onChange={(e) => setForm((p) => ({ ...p, previousSchoolType: e.target.value }))}>
          <option value="OTHER">Externo</option>
          <option value="CIENCIAS">CIENCIAS</option>
          <option value="CIENCIAS_APLICADAS">CIENCIAS APLICADAS</option>
          <option value="CIMAS">CIMAS</option>
        </select>
      </div>
    </BaseModal>
  );
}
