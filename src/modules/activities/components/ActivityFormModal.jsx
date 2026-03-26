import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useClassroomOptionsQuery } from "../../students/hooks/useClassroomOptionsQuery";

const TYPE_OPTIONS = [
  { value: "SPECIAL_COLLECTION", label: "Recaudación especial" },
  { value: "CONTEST", label: "Concurso" },
  { value: "EVENT", label: "Evento" },
  { value: "CAMPAIGN", label: "Campaña" },
];

const AUDIENCE_OPTIONS = [
  { value: "LEVEL", label: "Nivel completo" },
  { value: "GRADE", label: "Grado específico" },
  { value: "CLASSROOMS", label: "Salones específicos" },
  { value: "CUSTOM", label: "Selección manual" },
];

const LEVEL_OPTIONS = [
  { value: "INITIAL", label: "Inicial" },
  { value: "PRIMARY", label: "Primaria" },
  { value: "SECONDARY", label: "Secundaria" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Activa" },
  { value: "CLOSED", label: "Cerrada" },
  { value: "LIQUIDATED", label: "Liquidada" },
];

function mapInitialState(initialActivity, defaultCampus) {
  return {
    campusCode: initialActivity?.campus?.code || defaultCampus || "",
    name: initialActivity?.name || "",
    type: initialActivity?.type || "SPECIAL_COLLECTION",
    description: initialActivity?.description || "",
    audienceType: initialActivity?.audienceType || "LEVEL",
    targetLevel: initialActivity?.targetLevel || "SECONDARY",
    targetGrade: initialActivity?.targetGrade ? String(initialActivity.targetGrade) : "",
    classroomIds: Array.isArray(initialActivity?.classroomIds) ? initialActivity.classroomIds : [],
    amount: initialActivity?.amount ? String(initialActivity.amount) : "",
    allowSecretaryCollection: initialActivity?.allowSecretaryCollection ?? true,
    allowAuxiliarCollection: initialActivity?.allowAuxiliarCollection ?? true,
    allowAdminCollection: initialActivity?.allowAdminCollection ?? true,
    startsAt: initialActivity?.startsAt ? String(initialActivity.startsAt).slice(0, 16) : "",
    endsAt: initialActivity?.endsAt ? String(initialActivity.endsAt).slice(0, 16) : "",
    status: initialActivity?.status || "ACTIVE",
  };
}

export default function ActivityFormModal({
  open,
  onClose,
  onSubmit,
  initialActivity = null,
  defaultCampus = "",
  submitting = false,
}) {
  const [form, setForm] = useState(() => mapInitialState(initialActivity, defaultCampus));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(mapInitialState(initialActivity, defaultCampus));
    setError("");
  }, [open, initialActivity, defaultCampus]);

  const title = initialActivity ? "Editar activity" : "Nueva activity";
  const isEdit = Boolean(initialActivity);
  const classroomOptionsQuery = useClassroomOptionsQuery({
    campus: form.campusCode || undefined,
    level: form.audienceType === "CLASSROOMS" ? form.targetLevel || undefined : undefined,
    includeCapacity: false,
  });

  const statusOverlay = useMemo(() => (
    submitting
      ? { state: "loading", title: isEdit ? "Guardando cambios..." : "Creando activity..." }
      : null
  ), [isEdit, submitting]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }

    const payload = {
      campusCode: form.campusCode,
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim(),
      audienceType: form.audienceType,
      targetLevel: form.audienceType === "LEVEL" || form.audienceType === "GRADE" ? form.targetLevel : "",
      targetGrade: form.audienceType === "GRADE" ? form.targetGrade : "",
      classroomIds:
        form.audienceType === "CLASSROOMS"
          ? form.classroomIds
          : [],
      amount: Number(form.amount),
      allowSecretaryCollection: Boolean(form.allowSecretaryCollection),
      allowAuxiliarCollection: Boolean(form.allowAuxiliarCollection),
      allowAdminCollection: Boolean(form.allowAdminCollection),
      startsAt: form.startsAt || "",
      endsAt: form.endsAt || "",
      ...(isEdit ? { status: form.status } : {}),
    };

    try {
      await onSubmit?.(payload);
    } catch (submitError) {
      const message = submitError?.response?.data?.message || submitError?.message || "No se pudo guardar la activity.";
      setError(Array.isArray(message) ? message.join(". ") : message);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={submitting ? undefined : onClose}
      title={title}
      maxWidthClass="max-w-3xl"
      statusOverlay={statusOverlay}
      footer={(
        <div className="flex items-center justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={submitting}>Cancelar</SecondaryButton>
          <Button type="submit" form="activity-form" disabled={submitting}>{isEdit ? "Guardar" : "Crear activity"}</Button>
        </div>
      )}
    >
      <form id="activity-form" onSubmit={handleSubmit} className="grid gap-4 px-5 py-4">
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-3 md:grid-cols-3">
          <Input label="Campus" value={form.campusCode} onChange={(e) => handleChange("campusCode", e.target.value.toUpperCase())} placeholder="CIENCIAS" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select className="rounded border px-3 py-2 text-sm" value={form.type} onChange={(e) => handleChange("type", e.target.value)}>
              {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <Input label="Monto" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => handleChange("amount", e.target.value)} />
        </div>

        <Input label="Nombre" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Canguro Matemático 2026" />
        <Input label="Descripción" value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Cobro especial para actividad puntual" />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Alcance</label>
            <select className="rounded border px-3 py-2 text-sm" value={form.audienceType} onChange={(e) => handleChange("audienceType", e.target.value)}>
              {AUDIENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          {(form.audienceType === "LEVEL" || form.audienceType === "GRADE") ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nivel</label>
              <select className="rounded border px-3 py-2 text-sm" value={form.targetLevel} onChange={(e) => handleChange("targetLevel", e.target.value)}>
                {LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          ) : <div />}
          {form.audienceType === "GRADE" ? (
            <Input label="Grado" type="number" min="1" value={form.targetGrade} onChange={(e) => handleChange("targetGrade", e.target.value)} />
          ) : <div />}
        </div>

        {form.audienceType === "CLASSROOMS" ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium text-gray-700">Salones incluidos</p>
            <div className="grid max-h-[180px] gap-2 overflow-auto rounded-2xl border border-gray-200 bg-gray-50 p-3 md:grid-cols-2">
              {(classroomOptionsQuery.data?.items || []).map((option) => {
                const checked = form.classroomIds.includes(option.classroomId);
                return (
                  <label key={option.classroomId} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${checked ? "border-sky-300 bg-sky-50 text-sky-900" : "border-gray-200 bg-white text-gray-700"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.classroomIds, option.classroomId]
                          : form.classroomIds.filter((item) => item !== option.classroomId);
                        handleChange("classroomIds", next);
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
              {!classroomOptionsQuery.isLoading && !(classroomOptionsQuery.data?.items || []).length ? (
                <p className="text-sm text-gray-500">No hay salones disponibles con esos filtros.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Inicio" type="datetime-local" value={form.startsAt} onChange={(e) => handleChange("startsAt", e.target.value)} />
          <Input label="Fin" type="datetime-local" value={form.endsAt} onChange={(e) => handleChange("endsAt", e.target.value)} />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.allowSecretaryCollection} onChange={(e) => handleChange("allowSecretaryCollection", e.target.checked)} />
            Secretaría cobra
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.allowAuxiliarCollection} onChange={(e) => handleChange("allowAuxiliarCollection", e.target.checked)} />
            Auxiliar cobra
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.allowAdminCollection} onChange={(e) => handleChange("allowAdminCollection", e.target.checked)} />
            Admin cobra
          </label>
          {isEdit ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <select className="rounded border px-3 py-2 text-sm" value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          ) : <div />}
        </div>
      </form>
    </BaseModal>
  );
}
