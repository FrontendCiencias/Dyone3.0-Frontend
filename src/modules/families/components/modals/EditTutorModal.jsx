import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../../shared/ui/BaseModal";
import Button from "../../../../components/ui/Button";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";

const RELATIONSHIP_OPTIONS = ["MADRE", "PADRE", "APODERADO", "ABUELO", "ABUELA", "TÍO", "TÍA", "OTRO"];

function getInitialForm(tutor) {
  return {
    relationship: tutor?.relationship || "MADRE",
    isPrimary: Boolean(tutor?.isPrimary),
    livesWithStudent: Boolean(tutor?.livesWithStudent),
    notes: tutor?.notes || "",
  };
}

export default function EditTutorModal({ open, tutor, onClose, onConfirm, isPending, errorMessage }) {
  const [form, setForm] = useState(getInitialForm(null));

  useEffect(() => {
    if (!open) return;
    setForm(getInitialForm(tutor));
  }, [open, tutor]);

  const canSave = useMemo(() => form.relationship && !isPending, [form.relationship, isPending]);

  const handleSubmit = () => {
    onConfirm?.({
      relationship: form.relationship,
      isPrimary: form.isPrimary,
      livesWithStudent: form.livesWithStudent,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <BaseModal
      open={open}
      onClose={isPending ? undefined : onClose}
      title="Editar tutor"
      closeOnBackdrop={!isPending}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isPending}>Cancelar</SecondaryButton>
          <Button onClick={handleSubmit} disabled={!canSave}>{isPending ? "Guardando..." : "Guardar"}</Button>
        </div>
      }
    >
      <div className="space-y-3 p-5">
        <label className="block text-sm font-medium text-gray-700" htmlFor="relationship">Relación</label>
        <select
          id="relationship"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
          value={form.relationship}
          onChange={(e) => setForm((prev) => ({ ...prev, relationship: e.target.value }))}
          disabled={isPending}
        >
          {RELATIONSHIP_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(e) => setForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
            disabled={isPending}
          />
          Tutor principal
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.livesWithStudent}
            onChange={(e) => setForm((prev) => ({ ...prev, livesWithStudent: e.target.checked }))}
            disabled={isPending}
          />
          Vive con el estudiante
        </label>

        <label className="block text-sm font-medium text-gray-700" htmlFor="notes">Notas</label>
        <textarea
          id="notes"
          className="min-h-[90px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          disabled={isPending}
        />

        {errorMessage ? <p className="rounded-md bg-rose-50 p-2 text-sm text-rose-700">{errorMessage}</p> : null}
      </div>
    </BaseModal>
  );
}
