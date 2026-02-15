import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import StatusFeedback from "../../../shared/ui/StatusFeedback";

const AUTO_CLOSE_MS = 2000;
const initialState = { names: "", lastNames: "", dni: "" };

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo crear el alumno";
}

export default function CreateStudentInlineModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(initialState);
    setStatus("idle");
    setServerError("");
  }, [open]);

  useEffect(() => {
    if (!open || (status !== "success" && status !== "error")) return undefined;
    const timer = window.setTimeout(() => onClose?.(), AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [status, open, onClose]);

  const canSubmit = useMemo(() => form.names.trim() && form.lastNames.trim() && status === "idle", [form, status]);

  const handleSubmit = async () => {
    setStatus("submitting");
    setServerError("");

    try {
      await onCreate({
        names: form.names.trim(),
        lastNames: form.lastNames.trim(),
        dni: form.dni.trim() || undefined,
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
      title="Crear alumno y vincular"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={status === "submitting"}>Cancelar</SecondaryButton>
          <Button onClick={handleSubmit} disabled={!canSubmit}>Crear y vincular</Button>
        </div>
      }
    >
      <div className="relative space-y-3 p-5">
        <Input label="Nombres" value={form.names} onChange={(e) => setForm((prev) => ({ ...prev, names: e.target.value }))} />
        <Input label="Apellidos" value={form.lastNames} onChange={(e) => setForm((prev) => ({ ...prev, lastNames: e.target.value }))} />
        <Input label="DNI" value={form.dni} onChange={(e) => setForm((prev) => ({ ...prev, dni: e.target.value }))} />

        <LoadingOverlay open={overlayOpen}>
          {status === "submitting" ? (
            <>
              <Spinner />
              <p className="mt-3 text-sm font-medium text-gray-700">Creando alumno...</p>
            </>
          ) : (
            <StatusFeedback
              status={status}
              successText="Alumno creado y vinculado"
              errorText="No se pudo crear y vincular"
              errorDetail={serverError}
            />
          )}
        </LoadingOverlay>
      </div>
    </BaseModal>
  );
}
