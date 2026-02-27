import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import ModalFeedbackOverlay from "../../../shared/ui/ModalFeedbackOverlay";

const RELATIONSHIP_OPTIONS = ["MADRE", "PADRE", "APODERADO", "ABUELO", "ABUELA", "TÍO", "TÍA", "OTRO"];

const initialTutorForm = {
  names: "",
  lastNames: "",
  dni: "",
  phone: "",
  gender: "F",
  relationship: "MADRE",
  livesWithStudent: true,
  isPrimary: false,
};

function getErrorMessage(error) {
  if (error?.response?.status === 409) return "No se pudo crear: DNI duplicado.";
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo crear el tutor";
}

function getValidationErrors(form) {
  const errors = {};
  const names = form.names.trim();
  const lastNames = form.lastNames.trim();
  const dni = form.dni.trim();
  const phone = form.phone.trim();

  if (!names) errors.names = "Los nombres son obligatorios.";
  if (!lastNames) errors.lastNames = "Los apellidos son obligatorios.";
  if (dni && (!/^\d+$/.test(dni) || dni.length !== 8)) errors.dni = "El DNI debe tener 8 dígitos.";
  if (phone && (!/^\d+$/.test(phone) || phone.length !== 9)) errors.phone = "El celular debe tener 9 dígitos.";

  return errors;
}

export default function CreateTutorModal({ open, onClose, onCreate, endpointReady = true }) {
  const [form, setForm] = useState(initialTutorForm);
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(initialTutorForm);
    setStatus("idle");
    setServerError("");
  }, [open]);

  const validationErrors = useMemo(() => getValidationErrors(form), [form]);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const canSubmit = useMemo(() => {
    if (!endpointReady) return false;
    return !hasValidationErrors && status === "idle";
  }, [hasValidationErrors, status, endpointReady]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setStatus("submitting");
    setServerError("");
    try {
      await onCreate({
        ...form,
        names: form.names.trim(),
        lastNames: form.lastNames.trim(),
        dni: form.dni.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      setStatus("success");
    } catch (error) {
      setServerError(getErrorMessage(error));
      setStatus("error");
    }
  };

  const handleFeedbackClose = () => {
    if (status === "success") {
      onClose?.();
      return;
    }
    setStatus("idle");
    setServerError("");
  };

  const handleModalClose = () => {
    if (status === "success") return;
    onClose?.();
  };

  const cancelDisabled = status === "submitting" || status === "success";

  return (
    <BaseModal
      open={open}
      onClose={status === "submitting" ? undefined : handleModalClose}
      title="Crear tutor"
      closeOnBackdrop={status !== "submitting"}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={handleModalClose} disabled={cancelDisabled}>Cancelar</SecondaryButton>
          <Button onClick={handleSubmit} disabled={!canSubmit}>{status === "submitting" ? "Creando..." : "Crear tutor"}</Button>
        </div>
      }
    >
      <div className="relative space-y-3 p-5">
        {!endpointReady ? (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
            Asociación tutor↔familia pendiente de backend.
          </p>
        ) : null}

        <Input label="Nombres" value={form.names} onChange={(e) => setForm((prev) => ({ ...prev, names: e.target.value }))} />
        {validationErrors.names ? <p className="text-xs text-red-600">{validationErrors.names}</p> : null}

        <Input label="Apellidos" value={form.lastNames} onChange={(e) => setForm((prev) => ({ ...prev, lastNames: e.target.value }))} />
        {validationErrors.lastNames ? <p className="text-xs text-red-600">{validationErrors.lastNames}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Input label="DNI" value={form.dni} onChange={(e) => setForm((prev) => ({ ...prev, dni: e.target.value }))} />
            {validationErrors.dni ? <p className="mt-1 text-xs text-red-600">{validationErrors.dni}</p> : null}
          </div>
          <div>
            <Input label="Celular" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            {validationErrors.phone ? <p className="mt-1 text-xs text-red-600">{validationErrors.phone}</p> : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Género</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={form.gender}
              onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
            >
              <option value="F">F</option>
              <option value="M">M</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Relación</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={form.relationship}
              onChange={(e) => setForm((prev) => ({ ...prev, relationship: e.target.value }))}
            >
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm((prev) => ({ ...prev, isPrimary: e.target.checked }))} />
            Es principal
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.livesWithStudent} onChange={(e) => setForm((prev) => ({ ...prev, livesWithStudent: e.target.checked }))} />
            Vive con el/los alumnos
          </label>
        </div>

        <LoadingOverlay open={status === "submitting"}>
          <Spinner />
          <p className="mt-3 text-sm font-medium text-gray-700">Creando tutor...</p>
        </LoadingOverlay>

        <ModalFeedbackOverlay
          status={status}
          successText="Tutor creado correctamente"
          errorText="No se pudo crear el tutor"
          errorDetail={serverError}
          onClose={handleFeedbackClose}
        />
      </div>
    </BaseModal>
  );
}
