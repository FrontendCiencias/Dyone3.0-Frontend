import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import { useUnassignedStudentsSearchQuery } from "../hooks/useUnassignedStudentsSearchQuery";

function mapStudentResult(student) {
  const person = student?.person || student?.personId || {};
  const id = student?.studentId || student?.id || student?._id || person?.personId || person?.id || "";
  const lastNames = person?.lastNames || student?.lastNames || "";
  const names = person?.names || student?.names || "";
  const dni = person?.dni || student?.dni || null;
  const internalCode = student?.internalCode || student?.code || null;

  return { id, lastNames, names, dni, internalCode };
}

export default function LinkStudentModal({ open, onClose, onConfirm, linkedStudentIds = [], isLinking = false }) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setDebouncedQ("");
    setSelectedStudent(null);
  }, [open]);

  const searchQuery = useUnassignedStudentsSearchQuery(debouncedQ, 20, open);
  const students = useMemo(() => {
    const rows = Array.isArray(searchQuery.data)
      ? searchQuery.data
      : Array.isArray(searchQuery.data?.items)
        ? searchQuery.data.items
        : [];

    return rows.map(mapStudentResult).filter((student) => Boolean(student.id));
  }, [searchQuery.data]);

  const linkedSet = useMemo(() => new Set(linkedStudentIds.map((id) => String(id))), [linkedStudentIds]);

  const confirmDisabled = !selectedStudent || isLinking;

  return (
    <BaseModal
      open={open}
      onClose={isLinking ? undefined : onClose}
      title="Vincular alumno existente"
      maxWidthClass="max-w-2xl"
      closeOnBackdrop={!isLinking}
      footer={(
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isLinking}>Cancelar</SecondaryButton>
          <Button
            onClick={async () => {
              try {
                await onConfirm?.(selectedStudent);
              } catch (_) {
                // Mantener modal abierto para reintento
              }
            }}
            disabled={confirmDisabled}
          >
            {isLinking ? "Vinculando..." : "Confirmar vínculo"}
          </Button>
        </div>
      )}
    >
      <div className="relative space-y-3 p-5">
        <Input
          label="Buscar alumno"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="DNI, nombre o código"
        />

        {selectedStudent ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-2 text-sm text-blue-900">
            ¿Vincular a esta familia? <strong>{[selectedStudent.lastNames, selectedStudent.names].filter(Boolean).join(", ") || "Sin nombre"}</strong>
          </div>
        ) : null}

        <div className="max-h-60 space-y-2 overflow-auto">
          {students.map((student) => {
            const alreadyLinked = linkedSet.has(String(student.id));
            const isSelected = String(selectedStudent?.id || "") === String(student.id);

            return (
              <button
                key={student.id}
                type="button"
                disabled={alreadyLinked || isLinking}
                className={`w-full rounded-md border p-2 text-left text-sm ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"} ${alreadyLinked ? "cursor-not-allowed opacity-60" : ""}`}
                onClick={() => setSelectedStudent(student)}
              >
                <p className="font-medium text-gray-900">{[student.lastNames, student.names].filter(Boolean).join(", ") || "Sin nombre"}</p>
                <p className="text-xs text-gray-600">
                  {student.dni ? `DNI: ${student.dni}` : "DNI: —"}
                  {student.internalCode ? ` · Código: ${student.internalCode}` : ""}
                </p>
                {alreadyLinked ? <p className="text-xs text-amber-600">Ya vinculado a esta familia</p> : null}
              </button>
            );
          })}

          {!students.length && debouncedQ.length >= 2 && !searchQuery.isFetching ? (
            <p className="text-sm text-gray-500">No se encontraron alumnos sin familia.</p>
          ) : null}
          {debouncedQ.length < 2 ? <p className="text-sm text-gray-500">Escribe al menos 2 caracteres para buscar.</p> : null}
        </div>

        <LoadingOverlay open={isLinking || searchQuery.isFetching}>
          <Spinner />
          <p className="mt-3 text-sm font-medium text-gray-700">{isLinking ? "Vinculando alumno..." : "Buscando alumnos..."}</p>
        </LoadingOverlay>
      </div>
    </BaseModal>
  );
}
