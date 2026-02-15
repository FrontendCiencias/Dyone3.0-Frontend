import React, { useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { useEnrollmentsStudentSearchQuery } from "../hooks/useEnrollmentsStudentSearchQuery";
import { useCreateStudentMutation } from "../../students/hooks/useCreateStudentMutation";

function getStudentId(item) {
  return item?.id || item?._id;
}

export default function SearchOrCreateStudentModal({ open, onClose, onSelect }) {
  const [tab, setTab] = useState("search");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ names: "", lastNames: "", dni: "" });
  const studentsQuery = useEnrollmentsStudentSearchQuery({ q: search, enabled: open && tab === "search" });
  const createMutation = useCreateStudentMutation();

  const rows = useMemo(() => (Array.isArray(studentsQuery.data?.items) ? studentsQuery.data.items : []), [studentsQuery.data]);

  const handleCreate = async () => {
    if (!form.names.trim() || !form.lastNames.trim()) return;
    const data = await createMutation.mutateAsync({
      person: { names: form.names.trim(), lastNames: form.lastNames.trim(), dni: form.dni.trim() || undefined },
      student: {},
    });

    const student = data?.student || data;
    onSelect?.({ id: getStudentId(student), ...student });
    onClose?.();
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Agregar alumno al paquete"
      footer={<div className="flex justify-end"><SecondaryButton onClick={onClose}>Cerrar</SecondaryButton></div>}
    >
      <div className="space-y-3 p-5">
        <div className="flex gap-2">
          <SecondaryButton onClick={() => setTab("search")} className={tab === "search" ? "border-gray-900 text-gray-900" : ""}>Buscar</SecondaryButton>
          <SecondaryButton onClick={() => setTab("create")} className={tab === "create" ? "border-gray-900 text-gray-900" : ""}>Crear</SecondaryButton>
        </div>

        {tab === "search" ? (
          <>
            <Input label="Buscar alumno" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="DNI, código o nombre" />
            <div className="max-h-60 space-y-2 overflow-auto">
              {rows.map((student) => (
                <button
                  key={getStudentId(student)}
                  type="button"
                  className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
                  onClick={() => {
                    onSelect?.(student);
                    onClose?.();
                  }}
                >
                  <p className="font-medium text-gray-900">{student?.lastNames}, {student?.names}</p>
                  <p className="text-xs text-gray-600">DNI: {student?.dni || "-"} · Código: {student?.code || student?.internalCode || "-"}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <Input label="Nombres" value={form.names} onChange={(e) => setForm((p) => ({ ...p, names: e.target.value }))} />
            <Input label="Apellidos" value={form.lastNames} onChange={(e) => setForm((p) => ({ ...p, lastNames: e.target.value }))} />
            <Input label="DNI" value={form.dni} onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))} />
            <Button onClick={handleCreate} disabled={createMutation.isPending}>Crear y agregar</Button>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
