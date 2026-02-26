import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import ModalFeedbackOverlay from "../../../shared/ui/ModalFeedbackOverlay";
import { useCreateFamilyMutation } from "../hooks/useCreateFamilyMutation";
import { useCreateTutorMutation } from "../hooks/useCreateTutorMutation";

const initialTutor = { names: "", lastNames: "", dni: "", phone: "", relationship: "PADRE", isPrimary: true };

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo crear la familia";
}

function getFamilyId(payload) {
  return payload?.id || payload?.family?.id || payload?.familyId || payload?._id;
}

export default function FamilyCreateModal({ open, onClose, onCreated }) {
  const [tutor, setTutor] = useState(initialTutor);
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");

  const createFamilyMutation = useCreateFamilyMutation();
  const createTutorMutation = useCreateTutorMutation();

  const overlayOpen = status === "submitting";

  useEffect(() => {
    if (!open) return;
    setTutor(initialTutor);
    setStatus("idle");
    setServerError("");
    createFamilyMutation.reset();
    createTutorMutation.reset();
  }, [open]);

  const canSubmit = useMemo(() => status === "idle", [status]);
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

  const handleSubmit = async () => {
    setStatus("submitting");
    setServerError("");

    try {
      const familyPayload = await createFamilyMutation.mutateAsync({});
      const familyId = getFamilyId(familyPayload);

      if (familyId && tutor.names.trim() && tutor.lastNames.trim()) {
        if (!tutor.dni.trim()) {
          throw new Error("DNI del tutor es obligatorio para crear tutor.");
        }

        await createTutorMutation.mutateAsync({
          ...tutor,
          names: tutor.names.trim(),
          lastNames: tutor.lastNames.trim(),
          dni: tutor.dni.trim(),
          phone: tutor.phone.trim() || undefined,
          familyId,
        });
      }

      setStatus("success");
      onCreated?.(familyPayload);
    } catch (error) {
      setServerError(getErrorMessage(error));
      setStatus("error");
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={status === "submitting" ? undefined : handleModalClose}
      title="Nueva familia"
      maxWidthClass="max-w-xl"
      closeOnBackdrop={status !== "submitting"}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={handleModalClose} disabled={status === "submitting"}>Cancelar</SecondaryButton>
          <Button onClick={handleSubmit} disabled={!canSubmit}>Crear familia</Button>
        </div>
      }
    >
      <div className="relative space-y-3 p-5">
        <p className="text-sm text-gray-600">Crea la familia y opcionalmente registra tutor principal.</p>
        <Input label="Nombres tutor" value={tutor.names} onChange={(e) => setTutor((prev) => ({ ...prev, names: e.target.value }))} />
        <Input label="Apellidos tutor" value={tutor.lastNames} onChange={(e) => setTutor((prev) => ({ ...prev, lastNames: e.target.value }))} />
        <Input label="DNI tutor" value={tutor.dni} onChange={(e) => setTutor((prev) => ({ ...prev, dni: e.target.value }))} />
        <Input label="Celular" value={tutor.phone} onChange={(e) => setTutor((prev) => ({ ...prev, phone: e.target.value }))} />

        {!tutor.names.trim() || !tutor.lastNames.trim() ? (
          <p className="text-xs text-gray-500">Puedes crear familia sin tutor y registrarlo luego desde la ficha.</p>
        ) : null}

        <LoadingOverlay open={overlayOpen}>
          {status === "submitting" ? (
            <>
              <Spinner />
              <p className="mt-3 text-sm font-medium text-gray-700">Creando familia...</p>
            </>
          ) : null}
        </LoadingOverlay>

        <ModalFeedbackOverlay
          status={status}
          successText="Familia creada correctamente"
          errorText="No se pudo crear la familia"
          errorDetail={serverError}
          onClose={handleFeedbackClose}
        />
      </div>
    </BaseModal>
  );
}
