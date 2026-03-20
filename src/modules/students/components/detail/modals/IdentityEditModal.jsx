import React, { useEffect, useState } from "react";
import BaseModal from "../../../../../shared/ui/BaseModal";
import Button from "../../../../../components/ui/Button";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";
import Input from "../../../../../components/ui/Input";

export default function IdentityEditModal({
  open,
  onClose,
  student,
  onSave,
  saving = false,
  success = false,
  errorMessage = "",
}) {
  const [form, setForm] = useState({
    names: "",
    lastNames: "",
    dni: "",
    birthDate: "",
    gender: "",
    phone: "",
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
    });
  }, [open, student]);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Editar identidad"
      statusOverlay={saving ? {
        state: "loading",
        title: "Guardando cambios",
        message: "Actualizando la identidad del alumno...",
      } : success ? {
        state: "success",
        title: "Identidad actualizada",
        message: "",
      } : errorMessage ? {
        state: "error",
        title: "No se pudo guardar",
        message: errorMessage,
      } : null}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>
            Cancelar
          </SecondaryButton>
          <Button onClick={() => onSave?.(form)} disabled={saving || success}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 p-5">
        <Input
          label="Nombres"
          value={form.names}
          onChange={(e) => setForm((p) => ({ ...p, names: e.target.value }))}
        />

        <Input
          label="Apellidos"
          value={form.lastNames}
          onChange={(e) => setForm((p) => ({ ...p, lastNames: e.target.value }))}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label="DNI"
            value={form.dni}
            onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))}
          />

          <Input
            label="Fecha de nacimiento"
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Genero</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
              className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
              disabled={saving}
            >
              <option value="">Seleccionar...</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>

          <Input
            label="Telefono"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>

        {errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
      </div>
    </BaseModal>
  );
}
