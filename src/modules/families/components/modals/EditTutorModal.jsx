import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../../shared/ui/BaseModal";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../../shared/ui/LoadingOverlay";
import Spinner from "../../../../shared/ui/Spinner";
import ModalFeedbackOverlay from "../../../../shared/ui/ModalFeedbackOverlay";

const RELATIONSHIP_OPTIONS = ["MADRE", "PADRE", "APODERADO", "ABUELO", "ABUELA", "TÍO", "TÍA", "OTRO"];

function getInitialForm(tutor) {
  const person = tutor?.tutorPerson || tutor?.person || {};

  return {
    names: person?.names || "",
    lastNames: person?.lastNames || "",
    dni: person?.dni || "",
    phone: person?.phone || "",
    relationship: tutor?.relationship || "MADRE",
    isPrimary: Boolean(tutor?.isPrimary),
    livesWithStudent: Boolean(tutor?.livesWithStudent),
    notes: tutor?.notes || "",
  };
}

function getValidationErrors(form) {
  const errors = {};
  const names = form.names.trim();
  const lastNames = form.lastNames.trim();
  const dni = form.dni.trim();
  const phone = form.phone.trim();

  if (!names) errors.names = "Los nombres son obligatorios.";
  if (!lastNames) errors.lastNames = "Los apellidos son obligatorios.";

  if (dni && (!/^\d+$/.test(dni) || dni.length !== 8)) {
    errors.dni = "El DNI debe tener 8 dígitos numéricos.";
  }

  if (phone && (!/^\d+$/.test(phone) || phone.length !== 9)) {
    errors.phone = "El celular debe tener 9 dígitos numéricos.";
  }

  return errors;
}

function getErrorMessage(error, fallback = "No se pudo editar el tutor") {
  if (error?.response?.status === 409) {
    return "No se pudo guardar porque el DNI ya está registrado en otra persona.";
  }

  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return fallback;
}

export default function EditTutorModal({ open, tutor, onClose, onConfirm, isPending, errorMessage }) {
  const [form, setForm] = useState(getInitialForm(null));
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(getInitialForm(tutor));
    setStatus("idle");
    setServerError("");
  }, [open, tutor]);

  const validationErrors = useMemo(() => getValidationErrors(form), [form]);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const canSave = useMemo(
    () => form.relationship && !hasValidationErrors && status === "idle" && !isPending,
    [form.relationship, hasValidationErrors, isPending, status],
  );

  const handleFeedbackClose = () => {
    if (status === "success") {
      onClose?.();
      return;
    }
    setStatus("idle");
    setServerError("");
  };

  const handleModalClose = () => {
    if (status === "success" || status === "error") {
      handleFeedbackClose();
      return;
    }
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!canSave) return;

    setStatus("submitting");
    setServerError("");
    try {
      await onConfirm?.({
        names: form.names.trim(),
        lastNames: form.lastNames.trim(),
        dni: form.dni.trim() || undefined,
        phone: form.phone.trim() || undefined,
        relationship: form.relationship,
        isPrimary: form.isPrimary,
        livesWithStudent: form.livesWithStudent,
        notes: form.notes.trim() || undefined,
      });
      setStatus("success");
    } catch (error) {
      setServerError(getErrorMessage(error, errorMessage));
      setStatus("error");
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={status === "submitting" || isPending ? undefined : handleModalClose}
      title="Editar tutor"
      closeOnBackdrop={status !== "submitting" && !isPending}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={handleModalClose} disabled={status === "submitting" || isPending}>Cancelar</SecondaryButton>
          <Button onClick={handleSubmit} disabled={!canSave}>{status === "submitting" || isPending ? "Guardando..." : "Guardar"}</Button>
        </div>
      }
    >
      <div className="relative space-y-3 p-5">
        <Input
          label="Nombres"
          value={form.names}
          onChange={(e) => setForm((prev) => ({ ...prev, names: e.target.value }))}
        />
        {validationErrors.names ? <p className="text-xs text-red-600">{validationErrors.names}</p> : null}

        <Input
          label="Apellidos"
          value={form.lastNames}
          onChange={(e) => setForm((prev) => ({ ...prev, lastNames: e.target.value }))}
        />
        {validationErrors.lastNames ? <p className="text-xs text-red-600">{validationErrors.lastNames}</p> : null}

        <Input
          label="DNI"
          value={form.dni}
          onChange={(e) => setForm((prev) => ({ ...prev, dni: e.target.value }))}
        />
        {validationErrors.dni ? <p className="text-xs text-red-600">{validationErrors.dni}</p> : null}

        <Input
          label="Celular"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />
        {validationErrors.phone ? <p className="text-xs text-red-600">{validationErrors.phone}</p> : null}

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

        <LoadingOverlay open={status === "submitting"}>
          <Spinner />
          <p className="mt-3 text-sm font-medium text-gray-700">Guardando tutor...</p>
        </LoadingOverlay>

        <ModalFeedbackOverlay
          status={status}
          successText="Tutor actualizado correctamente"
          errorText="No se pudo editar el tutor"
          errorDetail={serverError || errorMessage}
          onClose={handleFeedbackClose}
        />
      </div>
    </BaseModal>
  );
}
