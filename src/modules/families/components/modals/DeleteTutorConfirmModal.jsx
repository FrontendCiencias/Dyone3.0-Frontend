import React from "react";
import BaseModal from "../../../../shared/ui/BaseModal";
import Button from "../../../../components/ui/Button";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../../shared/ui/LoadingOverlay";
import Spinner from "../../../../shared/ui/Spinner";
import ModalFeedbackOverlay from "../../../../shared/ui/ModalFeedbackOverlay";
import { getTutorFullName } from "../../domain/familyDisplay";

export default function DeleteTutorConfirmModal({ open, tutor, onClose, onConfirm, isPending, errorMessage }) {
  const [status, setStatus] = React.useState("idle");
  const [serverError, setServerError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setServerError("");
  }, [open, tutor]);

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
      const msg = error?.response?.data?.message || error?.message || errorMessage || "No se pudo eliminar el tutor";
      setServerError(Array.isArray(msg) ? msg.join(". ") : String(msg));
      setStatus("error");
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={status === "submitting" || isPending ? undefined : handleModalClose}
      title="Eliminar tutor"
      closeOnBackdrop={status !== "submitting" && !isPending}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={handleModalClose} disabled={status === "submitting" || isPending}>Cancelar</SecondaryButton>
          <Button onClick={handleConfirm} disabled={status === "submitting" || isPending}>{status === "submitting" || isPending ? "Eliminando..." : "Aceptar"}</Button>
        </div>
      }
    >
      <div className="relative space-y-2 p-5 text-sm text-gray-700">
        <p>¿Está seguro de eliminar permanentemente al tutor:</p>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="font-semibold text-gray-900">{getTutorFullName(tutor)}</p>
          <p>DNI: {tutor?.tutorPerson?.dni || "-"}</p>
          <p>Relación: {tutor?.relationship || "-"}</p>
        </div>

        <LoadingOverlay open={status === "submitting"}>
          <Spinner />
          <p className="mt-3 text-sm font-medium text-gray-700">Eliminando tutor...</p>
        </LoadingOverlay>

        <ModalFeedbackOverlay
          status={status}
          successText="Tutor eliminado correctamente"
          errorText="No se pudo eliminar el tutor"
          errorDetail={serverError || errorMessage}
          onClose={handleFeedbackClose}
        />
      </div>
    </BaseModal>
  );
}
