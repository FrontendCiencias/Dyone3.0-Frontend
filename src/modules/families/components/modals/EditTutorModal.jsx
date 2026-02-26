import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../../shared/ui/BaseModal";
import Button from "../../../../components/ui/Button";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../../shared/ui/LoadingOverlay";
import Spinner from "../../../../shared/ui/Spinner";
import ModalFeedbackOverlay from "../../../../shared/ui/ModalFeedbackOverlay";

const RELATIONSHIP_OPTIONS = ["MADRE", "PADRE", "APODERADO", "ABUELO", "ABUELA", "TÍO", "TÍA", "OTRO"];

function getInitialForm(tutor) {
  return {
    relationship: tutor?.relationship || "MADRE",
    isPrimary: Boolean(tutor?.isPrimary),
    livesWithStudent: Boolean(tutor?.livesWithStudent),
    notes: tutor?.notes || "",
  };
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

  const canSave = useMemo(() => form.relationship && status === "idle" && !isPending, [form.relationship, isPending, status]);

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
    setStatus("submitting");
    setServerError("");
    try {
      await onConfirm?.({
        relationship: form.relationship,
        isPrimary: form.isPrimary,
        livesWithStudent: form.livesWithStudent,
        notes: form.notes.trim() || undefined,
      });
      setStatus("success");
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || errorMessage || "No se pudo editar el tutor";
      setServerError(Array.isArray(msg) ? msg.join(". ") : String(msg));
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
