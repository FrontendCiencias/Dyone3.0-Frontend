import React, { useEffect, useState } from "react";
import BaseModal from "../../../../shared/ui/BaseModal";
import Button from "../../../../components/ui/Button";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";
import Input from "../../../../components/ui/Input";

export default function IdentityEditModal({ open, onClose, student, onSave, saving = false, errorMessage = "" }) {
  const [form, setForm] = useState({
    names: "",
    lastNames: "",
    dni: "",
    birthDate: "",
    gender: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      names: student?.names || "",
      lastNames: student?.lastNames || "",
      dni: student?.dni || "",
      birthDate: student?.birthDate ? String(student.birthDate).slice(0, 10) : "",
      gender: student?.gender || "",
      phone: student?.phone || "",
      address: student?.address || "",
    });
  }, [open, student]);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Editar identidad"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={saving}>Cancelar</SecondaryButton>
          <Button onClick={() => onSave?.(form)} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </div>
      }
    >
      <div className="space-y-3 p-5">
        <Input label="Nombres" value={form.names} onChange={(e) => setForm((p) => ({ ...p, names: e.target.value }))} />
        <Input
          label="Apellidos"
          value={form.lastNames}
          onChange={(e) => setForm((p) => ({ ...p, lastNames: e.target.value }))}
        />
        <Input label="DNI" value={form.dni} onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))} />
        <Input
          label="Fecha de nacimiento"
          type="date"
          value={form.birthDate}
          onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))}
        />
        <Input label="Género" value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} />
        <Input label="Teléfono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <Input label="Dirección" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
        {errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
      </div>
    </BaseModal>
  );
}
