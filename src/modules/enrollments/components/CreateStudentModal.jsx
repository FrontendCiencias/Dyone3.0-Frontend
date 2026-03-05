import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { getClassroomOptions } from "../../students/services/students.service";
import ClassroomOptionButton from "../../students/components/detail/ui/ClassroomOptionButton";

const CAMPUSES = ["CIMAS", "CIENCIAS", "CIENCIAS_APLICADAS"];
const LEVELS = ["INITIAL", "PRIMARY", "SECONDARY"];

const INITIAL = {
  names: "",
  lastNames: "",
  dni: "",
  gender: "F",
  campus: "",
  level: "",
  classroomId: "",
  classroomLabel: "",
  previousCampusMode: "CIMAS",
  previousCampusInput: "",
};

function resolvePreviousCampus(mode, input) {
  if (mode === "EXTERNO") return input.trim();
  return mode;
}

export default function CreateStudentModal({ open, onClose, onSubmit, isSubmitting = false, defaultCampus = "" }) {
  const [form, setForm] = useState(INITIAL);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({ ...INITIAL, campus: defaultCampus || prev.campus || "" }));
    setSubmitError("");
  }, [open, defaultCampus]);

  const classroomQuery = useQuery({
    queryKey: ["classroom-options", "create-student", form.level || "", form.campus || ""],
    queryFn: () => getClassroomOptions({ level: form.level, includeCapacity: true }),
    enabled: Boolean(open) && Boolean(form.level) && Boolean(form.campus),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const classroomOptions = useMemo(() => {
    const rows = Array.isArray(classroomQuery.data?.items)
      ? classroomQuery.data.items
      : Array.isArray(classroomQuery.data)
        ? classroomQuery.data
        : [];

    return rows.filter((item) => {
      const campusCode = String(item?.campusCode || item?.campusAlias || item?.campus || "").toUpperCase();
      if (!campusCode) return true;
      return campusCode === String(form.campus || "").toUpperCase();
    });
  }, [classroomQuery.data, form.campus]);

  const previousCampus = resolvePreviousCampus(form.previousCampusMode, form.previousCampusInput);
  const externalCampusInvalid = form.previousCampusMode === "EXTERNO" && previousCampus.length < 2;

  const canSubmit = useMemo(
    () => form.names.trim()
      && form.lastNames.trim()
      && form.level.trim()
      && form.campus.trim()
      && form.classroomId
      && !externalCampusInvalid
      && !isSubmitting,
    [form, isSubmitting, externalCampusInvalid],
  );

  const submit = async () => {
    if (!form.classroomId) {
      setSubmitError("Selecciona un salón para continuar.");
      return;
    }
    if (externalCampusInvalid) {
      setSubmitError("Ingresa un colegio anterior válido.");
      return;
    }

    setSubmitError("");
    await onSubmit?.({
      names: form.names.trim(),
      lastNames: form.lastNames.trim(),
      dni: form.dni.trim() || undefined,
      gender: form.gender,
      level: form.level.trim().toUpperCase(),
      campus: form.campus,
      classroomId: form.classroomId,
      classroomLabel: form.classroomLabel,
      previousCampus,
      previousSchoolType: form.previousCampusMode === "EXTERNO" ? "OTHER" : form.previousCampusMode,
    });
    setForm({ ...INITIAL, campus: defaultCampus || "" });
  };

  return (
    <BaseModal
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      title="Nuevo alumno"
      maxWidthClass="max-w-3xl"
      footer={(
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isSubmitting}>Cancelar</SecondaryButton>
          <Button onClick={submit} disabled={!canSubmit}>{isSubmitting ? "Guardando..." : "Crear"}</Button>
        </div>
      )}
    >
      <div className="space-y-3 p-5">
        <Input label="Nombres" value={form.names} onChange={(e) => setForm((p) => ({ ...p, names: e.target.value }))} />
        <Input label="Apellidos" value={form.lastNames} onChange={(e) => setForm((p) => ({ ...p, lastNames: e.target.value }))} />

        <div className="grid gap-2 sm:grid-cols-2">
          <Input label="DNI" value={form.dni} onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Género</label>
            <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Campus</label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={form.campus}
              onChange={(e) => setForm((p) => ({ ...p, campus: e.target.value, classroomId: "", classroomLabel: "" }))}
            >
              <option value="">Selecciona campus</option>
              {CAMPUSES.map((campus) => <option key={campus} value={campus}>{campus}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nivel</label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={form.level}
              onChange={(e) => setForm((p) => ({ ...p, level: e.target.value, classroomId: "", classroomLabel: "" }))}
            >
              <option value="">Selecciona nivel</option>
              {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
        </div>

        <p className="text-xs text-gray-600">Selecciona nivel y campus para ver los salones disponibles</p>

        {form.campus && form.level ? (
          <div className="space-y-2">
            {classroomQuery.isFetching ? <p className="text-sm text-gray-500">Cargando salones...</p> : null}
            {classroomQuery.isError ? <p className="text-sm text-red-700">No se pudo cargar salones disponibles.</p> : null}

            <div className="grid gap-2 sm:grid-cols-2">
              {classroomOptions.map((classroom) => {
                const classroomId = classroom?.classroomId || classroom?.id || classroom?._id || "";
                return (
                  <ClassroomOptionButton
                    key={classroomId || classroom?.label}
                    classroom={classroom}
                    isCurrent={false}
                    isSelected={String(form.classroomId) === String(classroomId)}
                    onSelect={(row) => setForm((p) => ({
                      ...p,
                      classroomId: row?.classroomId || row?.id || row?._id || "",
                      classroomLabel: row?.label || row?.name || row?.displayName || "",
                    }))}
                  />
                );
              })}
            </div>

            {!classroomQuery.isFetching && !classroomOptions.length && !classroomQuery.isError ? (
              <p className="text-sm text-amber-700">No hay salones disponibles para el campus/nivel seleccionado.</p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 sm:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Colegio anterior</label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={form.previousCampusMode}
              onChange={(e) => setForm((p) => ({ ...p, previousCampusMode: e.target.value }))}
            >
              <option value="CIENCIAS">CIENCIAS</option>
              <option value="CIENCIAS_APLICADAS">CIENCIAS_APLICADAS</option>
              <option value="CIMAS">CIMAS</option>
              <option value="EXTERNO">Externo</option>
            </select>
          </div>

          <Input
            label="Nombre colegio"
            value={form.previousCampusInput}
            onChange={(e) => setForm((p) => ({ ...p, previousCampusInput: e.target.value }))}
            disabled={form.previousCampusMode !== "EXTERNO"}
            placeholder="Ingresa colegio externo"
          />
        </div>

        {externalCampusInvalid ? <p className="text-xs text-red-600">Si eliges Externo, ingresa al menos 2 caracteres.</p> : null}
        {submitError ? <p className="text-sm text-amber-700">{submitError}</p> : null}
      </div>
    </BaseModal>
  );
}
