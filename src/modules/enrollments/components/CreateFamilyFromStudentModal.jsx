import React, { useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";

export default function CreateFamilyFromStudentModal({ open, onClose, student, onSubmit, isSubmitting = false }) {
  const [form, setForm] = useState({ tutorNames: "", tutorLastNames: "", tutorDni: "", tutorPhone: "" });
  const canSubmit = useMemo(() => form.tutorNames.trim() && form.tutorLastNames.trim() && !isSubmitting, [form, isSubmitting]);

  return (
    <BaseModal
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      title="Crear familia para alumno"
      footer={(
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isSubmitting}>Cancelar</SecondaryButton>
          <Button
            onClick={() => onSubmit?.({ ...form })}
            disabled={!canSubmit}
          >
            {isSubmitting ? "Creando..." : "Crear familia"}
          </Button>
        </div>
      )}
    >
      <div className="space-y-2 p-5">
        <p className="text-sm text-gray-600">Alumno: <span className="font-medium">{student?.person?.lastNames || ""}, {student?.person?.names || ""}</span></p>
        <Input label="Nombres tutor" value={form.tutorNames} onChange={(e) => setForm((p) => ({ ...p, tutorNames: e.target.value }))} />
        <Input label="Apellidos tutor" value={form.tutorLastNames} onChange={(e) => setForm((p) => ({ ...p, tutorLastNames: e.target.value }))} />
        <Input label="DNI tutor" value={form.tutorDni} onChange={(e) => setForm((p) => ({ ...p, tutorDni: e.target.value }))} />
        <Input label="Teléfono tutor" value={form.tutorPhone} onChange={(e) => setForm((p) => ({ ...p, tutorPhone: e.target.value }))} />
      </div>
    </BaseModal>
  );
}
