import React, { useEffect, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import ModalFeedbackOverlay from "../../../shared/ui/ModalFeedbackOverlay";

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

  const overlayOpen = status === "submitting";
  const feedbackOpen = status === "success" || status === "error";

  const handleFeedbackClose = () => {
    if (status === "success") {
      onClose?.();
      return;
    }
    setStatus("idle");
    setServerError("");
  };

  const handleModalClose = () => {
    if (feedbackOpen) {
      handleFeedbackClose();
      return;
    }
    onClose?.();
  };

  return (
    <BaseModal
      open={open}
      onClose={status === "submitting" ? undefined : handleModalClose}
      title="Confirmar tutor principal"
      closeOnBackdrop={status !== "submitting"}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={handleModalClose} disabled={status === "submitting"}>Cancelar</SecondaryButton>
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
          ) : null}
        </LoadingOverlay>

        <ModalFeedbackOverlay
          status={status}
          successText="Tutor principal actualizado"
          errorText="No se pudo actualizar el tutor principal"
          errorDetail={serverError}
          onClose={handleFeedbackClose}
        />
      </div>
    </BaseModal>
  );
}
