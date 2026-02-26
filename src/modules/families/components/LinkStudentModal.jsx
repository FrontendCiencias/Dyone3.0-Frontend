import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import ModalFeedbackOverlay from "../../../shared/ui/ModalFeedbackOverlay";
import { useStudentsFamilySearchQuery } from "../hooks/useStudentsFamilySearchQuery";

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo vincular el alumno";
}

function mapStudentResult(student) {
  const person = student?.personId || {};
  const id = student?.id || student?._id || person?.id || person?._id || "";
  const lastNames = person?.lastNames || student?.lastNames || "";
  const names = person?.names || student?.names || "";
  const dni = person?.dni || student?.dni || null;
  const code = student?.code || person?.code || null;
  const familyId = student?.familyId || null;
  return { id, lastNames, names, dni, code, familyId };
}

export default function LinkStudentModal({ open, onClose, onConfirm, linkedStudentIds = [] }) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setDebouncedQ("");
    setSelectedStudentId("");
    setStatus("idle");
    setServerError("");
  }, [open]);

  const searchQuery = useStudentsFamilySearchQuery({ q: debouncedQ, enabled: open });
  const students = useMemo(() => {
    const rows = Array.isArray(searchQuery.data)
      ? searchQuery.data
      : Array.isArray(searchQuery.data?.items)
        ? searchQuery.data.items
        : [];
    return rows.map(mapStudentResult).filter((student) => Boolean(student.id));
  }, [searchQuery.data]);

  const linkedSet = useMemo(() => new Set(linkedStudentIds.map((id) => String(id))), [linkedStudentIds]);

  const handleSubmit = async () => {
    if (!selectedStudentId) return;
    const selectedStudent = students.find((student) => String(student.id) === String(selectedStudentId));

    if (linkedSet.has(String(selectedStudentId))) {
      setServerError("El alumno ya está vinculado a esta familia.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setServerError("");
    try {
      await onConfirm({ studentId: selectedStudentId, familyId: selectedStudent?.familyId || null });
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
      title="Vincular alumno existente"
      maxWidthClass="max-w-2xl"
      closeOnBackdrop={status !== "submitting"}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={handleModalClose} disabled={status === "submitting"}>Cancelar</SecondaryButton>
          <Button onClick={handleSubmit} disabled={!selectedStudentId || status !== "idle"}>Vincular</Button>
        </div>
      }
    >
      <div className="relative space-y-3 p-5">
        <Input label="Buscar alumno" value={q} onChange={(e) => setQ(e.target.value)} placeholder="DNI, nombre o código" />
        <div className="max-h-60 space-y-2 overflow-auto">
          {students.map((student) => {
            const alreadyLinked = linkedSet.has(String(student.id));
            return (
              <button
                key={student.id}
                type="button"
                disabled={alreadyLinked}
                className={`w-full rounded-md border p-2 text-left text-sm ${selectedStudentId === student.id ? "border-blue-500 bg-blue-50" : "border-gray-200"} ${alreadyLinked ? "cursor-not-allowed opacity-60" : ""}`}
                onClick={() => setSelectedStudentId(student.id)}
              >
                <p className="font-medium text-gray-900">{[student.lastNames, student.names].filter(Boolean).join(", ") || "Sin nombre"}</p>
                <p className="text-xs text-gray-600">
                  {student.dni ? `DNI: ${student.dni}` : "DNI: —"}
                  {student.code ? ` · Código: ${student.code}` : ""}
                </p>
                {alreadyLinked ? <p className="text-xs text-amber-600">Ya vinculado a esta familia</p> : null}
              </button>
            );
          })}
          {!students.length && debouncedQ.length >= 2 && !searchQuery.isFetching && (
            <p className="text-sm text-gray-500">Sin resultados.</p>
          )}
        </div>

        <LoadingOverlay open={overlayOpen && !feedbackOpen}>
          {status === "submitting" ? (
            <>
              <Spinner />
              <p className="mt-3 text-sm font-medium text-gray-700">Vinculando alumno...</p>
            </>
          ) : null}
        </LoadingOverlay>

        <ModalFeedbackOverlay
          status={status}
          successText="Alumno vinculado correctamente"
          errorText="No se pudo vincular el alumno"
          errorDetail={serverError}
          onClose={handleFeedbackClose}
        />
      </div>
    </BaseModal>
  );
}
