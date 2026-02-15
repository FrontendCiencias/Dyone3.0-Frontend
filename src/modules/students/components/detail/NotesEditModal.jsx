import React, { useEffect, useState } from "react";
import BaseModal from "../../../../shared/ui/BaseModal";
import Button from "../../../../components/ui/Button";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";

export default function NotesEditModal({ open, onClose, value = "", onSave }) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setNotes(value || "");
  }, [open, value]);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Editar notas internas"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
          <Button onClick={() => onSave?.(notes)}>Guardar</Button>
        </div>
      }
    >
      <div className="space-y-3 p-5">
        <textarea
          className="min-h-[180px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe notas de secretaría..."
        />
        <p className="text-xs text-gray-500">TODO: guardar notas con endpoint dedicado cuando esté disponible.</p>
      </div>
    </BaseModal>
  );
}
