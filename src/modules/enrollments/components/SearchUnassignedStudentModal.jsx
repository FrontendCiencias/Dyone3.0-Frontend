import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useUnassignedStudentsSearchQuery } from "../../families/hooks/useUnassignedStudentsSearchQuery";

function mapStudent(row) {
  const person = row?.person || row?.personId || {};
  const studentId = row?.studentId || row?.id || row?._id;
  return {
    studentId,
    familyId: row?.familyId || null,
    person: {
      names: person?.names || row?.names || "",
      lastNames: person?.lastNames || row?.lastNames || "",
      dni: person?.dni || row?.dni || "",
    },
    hasVacancy: Boolean(row?.hasVacancy),
    classroom: row?.classroom || null,
    cycleStatus: row?.cycleStatus,
    activeStatus: row?.activeStatus,
    previousSchoolType: row?.previousSchoolType,
    level: row?.level || row?.educationLevel || row?.currentLevel || "",
    grade: row?.grade || row?.currentGrade || "",
  };
}

export default function SearchUnassignedStudentModal({ open, onClose, onSelect }) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setDebouncedQ("");
  }, [open]);

  const query = useUnassignedStudentsSearchQuery(debouncedQ, 20, open);
  const results = useMemo(() => {
    const rows = Array.isArray(query.data?.items) ? query.data.items : Array.isArray(query.data) ? query.data : [];
    return rows.map(mapStudent).filter((row) => Boolean(row.studentId));
  }, [query.data]);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Buscar alumno"
      maxWidthClass="max-w-2xl"
      footer={<div className="flex justify-end"><SecondaryButton onClick={onClose}>Cerrar</SecondaryButton></div>}
    >
      <div className="space-y-3 p-5">
        <Input label="Buscar alumno" value={q} onChange={(e) => setQ(e.target.value)} placeholder="DNI, nombre o código" />

        {query.isFetching ? <p className="text-sm text-gray-500">Buscando...</p> : null}
        {query.isError ? <p className="text-sm text-red-700">No se pudo buscar alumnos.</p> : null}

        <div className="max-h-72 space-y-2 overflow-auto">
          {results.map((item) => (
            <button
              key={item.studentId}
              type="button"
              className="w-full rounded-md border border-gray-200 p-2 text-left text-sm hover:bg-gray-50"
              onClick={() => {
                onSelect?.(item);
                onClose?.();
              }}
            >
              <p className="font-medium text-gray-900">{item?.person?.lastNames || ""}, {item?.person?.names || ""}</p>
              <p className="text-xs text-gray-600">DNI: {item?.person?.dni || "-"}</p>
            </button>
          ))}

          {!query.isFetching && debouncedQ.length >= 2 && !results.length && !query.isError ? (
            <p className="text-sm text-gray-500">No se encontraron alumnos</p>
          ) : null}
          {debouncedQ.length < 2 ? <p className="text-sm text-gray-500">Escribe al menos 2 caracteres para buscar.</p> : null}
        </div>
      </div>
    </BaseModal>
  );
}
