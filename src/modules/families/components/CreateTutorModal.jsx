import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import StatusFeedback from "../../../shared/ui/StatusFeedback";

const AUTO_CLOSE_MS = 2000;
const initialTutorForm = {
  names: "",
  lastNames: "",
  dni: "",
  phone: "",
  relationship: "MADRE",
  livesWithStudent: true,
  isPrimary: false,
};

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo crear el tutor";
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

  useEffect(() => {
    if (!open || (status !== "success" && status !== "error")) return undefined;
    const timer = window.setTimeout(() => onClose?.(), AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [status, open, onClose]);

  const canSubmit = useMemo(() => {
    if (!endpointReady) return false;
    return form.names.trim() && form.lastNames.trim() && form.dni.trim() && status === "idle";
  }, [form, status, endpointReady]);

  const handleSubmit = async () => {
    setStatus("submitting");
    setServerError("");
    try {
      await onCreate({
        ...form,
        names: form.names.trim(),
        lastNames: form.lastNames.trim(),
        dni: form.dni.trim(),
        phone: form.phone.trim() || undefined,
      });
      setStatus("success");
    } catch (error) {
      setServerError(getErrorMessage(error));
      setStatus("error");
    }
  };

  const overlayOpen = status === "submitting" || status === "success" || status === "error";

  return (
    <BaseModal
      open={open}
      onClose={status === "submitting" ? undefined : onClose}
      title="Crear tutor"
      closeOnBackdrop={status !== "submitting"}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={status === "submitting"}>Cancelar</SecondaryButton>
          <Button onClick={handleSubmit} disabled={!canSubmit}>Crear tutor</Button>
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
        <Input label="Apellidos" value={form.lastNames} onChange={(e) => setForm((prev) => ({ ...prev, lastNames: e.target.value }))} />
        <Input label="DNI" value={form.dni} onChange={(e) => setForm((prev) => ({ ...prev, dni: e.target.value }))} />
        <Input label="Celular" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />

        <LoadingOverlay open={overlayOpen}>
          {status === "submitting" ? (
            <>
              <Spinner />
              <p className="mt-3 text-sm font-medium text-gray-700">Creando tutor...</p>
            </>
          ) : (
            <StatusFeedback
              status={status}
              successText="Tutor creado correctamente"
              errorText="No se pudo crear el tutor"
              errorDetail={serverError}
            />
          )}
        </LoadingOverlay>
      </div>
    </BaseModal>
  );
}
