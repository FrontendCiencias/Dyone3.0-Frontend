import React from "react";
import Button from "../../../../../components/ui/Button";
import BaseModal from "../../../../../shared/ui/BaseModal";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";

export default function TransferStudentModal({
  open,
  onClose,
  reason,
  setReason,
  onConfirm,
  isPending,
  isSuccess,
  errorMessage,
}) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Marcar como trasladado"
      statusOverlay={isPending ? {
        state: "loading",
        title: "Marcando traslado",
        message: "Actualizando el estado del alumno...",
      } : isSuccess ? {
        state: "success",
        title: "Alumno trasladado",
        message: "Verifica el check y luego cierra el modal.",
      } : errorMessage ? {
        state: "error",
        title: "No se pudo trasladar",
        message: errorMessage,
      } : null}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
          <Button onClick={onConfirm} disabled={isPending || isSuccess || !reason.trim()}>Confirmar</Button>
        </div>
      }
    >
      <div className="space-y-3 p-5 text-sm text-gray-700">
        <label className="block text-sm font-medium text-gray-700">Motivo</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[110px] w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        {errorMessage ? <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{errorMessage}</p> : null}
      </div>
    </BaseModal>
  );
}
