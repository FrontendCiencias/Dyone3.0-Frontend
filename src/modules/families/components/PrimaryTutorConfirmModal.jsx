import React, { useEffect, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import StatusFeedback from "../../../shared/ui/StatusFeedback";

const AUTO_CLOSE_MS = 2000;

function getErrorMessage(error) {
  if (error?.response?.status === 404) {
    return "Backend pendiente: endpoint para cambiar tutor principal no disponible aún.";
  }

  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo actualizar el tutor principal";
}

export default function PrimaryTutorConfirmModal({ open, onClose, tutorName, onConfirm }) {
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setServerError("");
  }, [open]);

  useEffect(() => {
    if (!open || (status !== "success" && status !== "error")) return undefined;

    const timer = window.setTimeout(() => onClose?.(), AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [status, open, onClose]);

  const handleConfirm = async () => {
    setStatus("submitting");
    setServerError("");

    try {
      await onConfirm?.();
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
      title="Confirmar tutor principal"
      closeOnBackdrop={status !== "submitting"}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={status === "submitting"}>Cancelar</SecondaryButton>
          <Button onClick={handleConfirm} disabled={status !== "idle"}>Confirmar</Button>
        </div>
      }
    >
      <div className="relative p-5">
        <p className="text-sm text-gray-700">¿Deseas establecer a <span className="font-semibold">{tutorName || "este tutor"}</span> como tutor principal?</p>

        <LoadingOverlay open={overlayOpen}>
          {status === "submitting" ? (
            <>
              <Spinner />
              <p className="mt-3 text-sm font-medium text-gray-700">Actualizando tutor principal...</p>
            </>
          ) : (
            <StatusFeedback
              status={status}
              successText="Tutor principal actualizado"
              errorText="No se pudo actualizar el tutor principal"
              errorDetail={serverError}
            />
          )}
        </LoadingOverlay>
      </div>
    </BaseModal>
  );
}
