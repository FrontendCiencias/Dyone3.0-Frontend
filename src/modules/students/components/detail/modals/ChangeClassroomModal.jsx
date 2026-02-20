import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../../../components/ui/Button";
import LoadingOverlay from "../../../../../shared/ui/LoadingOverlay";
import BaseModal from "../../../../../shared/ui/BaseModal";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";
import Spinner from "../../../../../shared/ui/Spinner";
import ClassroomOptionButton from "../ui/ClassroomOptionButton";

const DEFAULT_REASON = "Reorganización";

export default function ChangeClassroomModal({
  open,
  onClose,
  classrooms,
  currentClassroomId,
  onSave,
  isLoading,
  isError,
  mutationPending,
  mutationErrorMessage,
}) {
  const [selectedClassroomId, setSelectedClassroomId] = useState(null);
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [reasonError, setReasonError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedClassroomId(null);
    setReason(DEFAULT_REASON);
    setReasonError("");
  }, [open]);

  const isSaveDisabled = useMemo(() => {
    if (mutationPending) return true;
    if (!selectedClassroomId) return true;
    return String(selectedClassroomId) === String(currentClassroomId || "");
  }, [mutationPending, selectedClassroomId, currentClassroomId]);

  const handleSave = () => {
    if (!reason.trim()) {
      setReasonError("El motivo es obligatorio.");
      return;
    }

    setReasonError("");
    onSave?.({ classroomId: selectedClassroomId, reason: reason.trim() });
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Cambiar aula"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={mutationPending}>Cancelar</SecondaryButton>
          <Button onClick={handleSave} disabled={isSaveDisabled}>Guardar</Button>
        </div>
      }
    >
      <div className="space-y-3 p-5 text-sm text-gray-700">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Motivo del cambio</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (reasonError) setReasonError("");
            }}
            className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm"
            placeholder="Ingrese el motivo"
          />
          {reasonError ? <p className="text-xs text-red-700">{reasonError}</p> : null}
        </div>

        <p className="text-sm font-medium text-gray-700">Seleccione el nuevo salón</p>
        {isLoading ? <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-500">Cargando secciones…</p> : null}
        {isError ? <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">No se pudieron cargar las secciones disponibles.</p> : null}

        {!isLoading && !isError ? (
          <div className="grid gap-2">
            {classrooms.map((classroom) => {
              const classroomId = classroom?.classroomId;
              const isCurrent = String(currentClassroomId || "") === String(classroomId || "");
              const isSelected = String(selectedClassroomId || "") === String(classroomId || "");

              return (
                <ClassroomOptionButton
                  key={classroomId || classroom?.label}
                  classroom={classroom}
                  isCurrent={isCurrent}
                  isSelected={isSelected}
                  onSelect={(targetClassroom) => setSelectedClassroomId(targetClassroom?.classroomId || null)}
                />
              );
            })}
          </div>
        ) : null}

        {!isLoading && !isError && !classrooms.length ? (
          <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-500">No existen secciones configuradas para este grado y nivel.</p>
        ) : null}

        {mutationErrorMessage ? <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{mutationErrorMessage}</p> : null}
        <LoadingOverlay open={mutationPending}>
          <Spinner />
          <p className="mt-3 text-sm">Cambiando aula...</p>
        </LoadingOverlay>
      </div>
    </BaseModal>
  );
}
