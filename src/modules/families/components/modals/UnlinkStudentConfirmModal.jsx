import React from "react";
import BaseModal from "../../../../shared/ui/BaseModal";
import Button from "../../../../components/ui/Button";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../../shared/ui/LoadingOverlay";
import Spinner from "../../../../shared/ui/Spinner";
import ModalFeedbackOverlay from "../../../../shared/ui/ModalFeedbackOverlay";
import { getStudentFullName } from "../detail/cards/StudentsCard";

export default function UnlinkStudentConfirmModal({ open, student, onClose, onConfirm, isPending, errorMessage }) {
  const [status, setStatus] = React.useState("idle");
  const [serverError, setServerError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setServerError("");
  }, [open, student]);

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

  const handleConfirm = async () => {
    setStatus("submitting");
    setServerError("");
    try {
      await onConfirm?.();
      setStatus("success");
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || errorMessage || "No se pudo desvincular el estudiante";
      setServerError(Array.isArray(msg) ? msg.join(". ") : String(msg));
      setStatus("error");
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={status === "submitting" || isPending ? undefined : handleModalClose}
      title="Desvincular estudiante"
      closeOnBackdrop={status !== "submitting" && !isPending}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={handleModalClose} disabled={status === "submitting" || isPending}>Cancelar</SecondaryButton>
          <Button onClick={handleConfirm} disabled={status === "submitting" || isPending}>{status === "submitting" || isPending ? "Desvinculando..." : "Aceptar"}</Button>
        </div>
      }
    >
      <div className="relative space-y-2 p-5 text-sm text-gray-700">
        <p>¿Está seguro de desvincular al estudiante <span className="font-semibold">{getStudentFullName(student)}</span> de esta familia?</p>

        <LoadingOverlay open={status === "submitting"}>
          <Spinner />
          <p className="mt-3 text-sm font-medium text-gray-700">Desvinculando estudiante...</p>
        </LoadingOverlay>

        <ModalFeedbackOverlay
          status={status}
          successText="Estudiante desvinculado correctamente"
          errorText="No se pudo desvincular el estudiante"
          errorDetail={serverError || errorMessage}
          onClose={handleFeedbackClose}
        />
      </div>
    </BaseModal>
  );
}
