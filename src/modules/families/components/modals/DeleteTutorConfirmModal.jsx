import React from "react";
import BaseModal from "../../../../shared/ui/BaseModal";
import Button from "../../../../components/ui/Button";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";
import { getTutorFullName } from "../../domain/familyDisplay";

export default function DeleteTutorConfirmModal({ open, tutor, onClose, onConfirm, isPending, errorMessage }) {
  return (
    <BaseModal
      open={open}
      onClose={isPending ? undefined : onClose}
      title="Eliminar tutor"
      closeOnBackdrop={!isPending}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isPending}>Cancelar</SecondaryButton>
          <Button onClick={onConfirm} disabled={isPending}>{isPending ? "Eliminando..." : "Aceptar"}</Button>
        </div>
      }
    >
      <div className="space-y-2 p-5 text-sm text-gray-700">
        <p>¿Está seguro de eliminar permanentemente al tutor:</p>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="font-semibold text-gray-900">{getTutorFullName(tutor)}</p>
          <p>DNI: {tutor?.tutorPerson?.dni || "-"}</p>
          <p>Relación: {tutor?.relationship || "-"}</p>
        </div>
        {errorMessage ? <p className="rounded-md bg-rose-50 p-2 text-rose-700">{errorMessage}</p> : null}
      </div>
    </BaseModal>
  );
}
