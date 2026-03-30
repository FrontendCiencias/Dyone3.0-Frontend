import React, { useEffect, useState } from "react";
import BaseModal from "../../../../../shared/ui/BaseModal";
import Button from "../../../../../components/ui/Button";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";

export default function NotesEditModal({ open, onClose, value = "", onSave, saving = false, success = false, errorMessage = "" }) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setNotes(value || "");
  }, [open, value]);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Editar observaciones del alumno"
      statusOverlay={saving ? {
        state: "loading",
        title: "Guardando observaciones",
        message: "Actualizando las observaciones del alumno...",
      } : success ? {
        state: "success",
        title: "Observaciones guardadas",
        message: "Verifica el check y luego cierra el modal.",
      } : errorMessage ? {
        state: "error",
        title: "No se pudo guardar",
        message: errorMessage,
      } : null}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
          <Button onClick={() => onSave?.(notes)} disabled={saving || success}>Guardar</Button>
        </div>
      }
    >
      <div className="space-y-3 p-5">
        <textarea
          className="min-h-[180px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe observaciones del alumno..."
        />
        {errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
      </div>
    </BaseModal>
  );
}
