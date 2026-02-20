import React from "react";
import BaseModal from "../../../../shared/ui/BaseModal";
import Button from "../../../../components/ui/Button";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";
import { getStudentFullName } from "../detail/cards/StudentsCard";

export default function UnlinkStudentConfirmModal({ open, student, onClose, onConfirm, isPending, errorMessage }) {
  return (
    <BaseModal
      open={open}
      onClose={isPending ? undefined : onClose}
      title="Desvincular estudiante"
      closeOnBackdrop={!isPending}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isPending}>Cancelar</SecondaryButton>
          <Button onClick={onConfirm} disabled={isPending}>{isPending ? "Desvinculando..." : "Aceptar"}</Button>
        </div>
      }
    >
      <div className="space-y-2 p-5 text-sm text-gray-700">
        <p>¿Está seguro de desvincular al estudiante <span className="font-semibold">{getStudentFullName(student)}</span> de esta familia?</p>
        {errorMessage ? <p className="rounded-md bg-rose-50 p-2 text-rose-700">{errorMessage}</p> : null}
      </div>
    </BaseModal>
  );
}
