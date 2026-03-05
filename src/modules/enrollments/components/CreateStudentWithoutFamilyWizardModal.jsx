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
const RELATIONSHIP_OPTIONS = ["MADRE", "PADRE", "APODERADO", "ABUELO", "ABUELA", "TÍO", "TÍA", "OTRO"];

const INITIAL_STUDENT = {
  names: "",
  lastNames: "",
  dni: "",
  gender: "F",
  campusCode: "",
  level: "",
  classroomId: "",
  classroomLabel: "",
  previousCampusMode: "CIMAS",
  previousCampusInput: "",
};

const INITIAL_TUTOR = {
  names: "",
  lastNames: "",
  dni: "",
  phone: "",
  gender: "F",
  relationship: "PADRE",
  livesWithStudent: true,
};

function getValidationErrors(form) {
  const errors = {};
  if (!form.names.trim()) errors.names = "Los nombres son obligatorios.";
  if (!form.lastNames.trim()) errors.lastNames = "Los apellidos son obligatorios.";
  if (form.dni && (!/^\d+$/.test(form.dni) || form.dni.length !== 8)) errors.dni = "El DNI debe tener 8 dígitos.";
  if (form.phone && (!/^\d+$/.test(form.phone) || form.phone.length !== 9)) errors.phone = "El celular debe tener 9 dígitos.";
  return errors;
}

export default function CreateStudentWithoutFamilyWizardModal({ open, onClose, onSubmit, isSubmitting = false, defaultCampus = "" }) {
  const [step, setStep] = useState(1);
  const [student, setStudent] = useState(INITIAL_STUDENT);
  const [tutor, setTutor] = useState(INITIAL_TUTOR);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setStudent((prev) => ({ ...INITIAL_STUDENT, campusCode: defaultCampus || prev.campusCode || "" }));
    setTutor(INITIAL_TUTOR);
    setError("");
  }, [open, defaultCampus]);

  const classroomQuery = useQuery({
    queryKey: ["classroom-options", "student-without-family", student.level || "", student.campusCode || ""],
    queryFn: () => getClassroomOptions({ level: student.level, grade: "", includeCapacity: true }),
    enabled: Boolean(open) && Boolean(student.level) && Boolean(student.campusCode),
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
      return campusCode === String(student.campusCode || "").toUpperCase();
    });
  }, [classroomQuery.data, student.campusCode]);

  const previousCampus = student.previousCampusMode === "EXTERNO"
    ? student.previousCampusInput.trim()
    : student.previousCampusMode;

  const canContinueStep1 = Boolean(student.names.trim() && student.lastNames.trim() && student.gender && student.classroomId);
  const externalInvalid = student.previousCampusMode === "EXTERNO" && previousCampus.length < 2;

  const tutorErrors = useMemo(() => getValidationErrors(tutor), [tutor]);
  const canSubmitStep2 = Object.keys(tutorErrors).length === 0 && !externalInvalid && !isSubmitting;

  const handleContinue = () => {
    if (!canContinueStep1) {
      setError("Completa datos del alumno y selecciona un salón.");
      return;
    }
    if (externalInvalid) {
      setError("Ingresa un colegio anterior válido.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!canSubmitStep2) return;
    setError("");
    try {
      await onSubmit?.({
        student: {
          names: student.names.trim(),
          lastNames: student.lastNames.trim(),
          dni: student.dni.trim() || undefined,
          gender: student.gender,
          level: student.level,
          campusCode: student.campusCode,
          classroomId: student.classroomId,
          classroomLabel: student.classroomLabel,
          previousCampus,
          previousSchoolType: student.previousCampusMode === "EXTERNO" ? "OTHER" : student.previousCampusMode,
        },
        tutor: {
          ...tutor,
          names: tutor.names.trim(),
          lastNames: tutor.lastNames.trim(),
          dni: tutor.dni.trim() || undefined,
          phone: tutor.phone.trim() || undefined,
          isPrimary: true,
        },
      });
    } catch (submitError) {
      setError(submitError?.response?.data?.message || submitError?.message || "No se pudo completar el proceso.");
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      title="Nuevo alumno"
      maxWidthClass="max-w-3xl"
      closeOnBackdrop={!isSubmitting}
      footer={(
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isSubmitting}>Cancelar</SecondaryButton>
          {step === 1 ? (
            <Button onClick={handleContinue} disabled={isSubmitting}>Continuar</Button>
          ) : (
            <>
              <SecondaryButton onClick={() => setStep(1)} disabled={isSubmitting}>Volver</SecondaryButton>
              <Button onClick={handleSubmit} disabled={!canSubmitStep2}>{isSubmitting ? "Guardando..." : "Crear alumno y familia"}</Button>
            </>
          )}
        </div>
      )}
    >
      <div className="space-y-3 p-5">
        <p className="text-xs font-medium text-gray-600">Paso {step} de 2</p>

        {step === 1 ? (
          <>
            <Input label="Nombres" value={student.names} onChange={(e) => setStudent((p) => ({ ...p, names: e.target.value }))} />
            <Input label="Apellidos" value={student.lastNames} onChange={(e) => setStudent((p) => ({ ...p, lastNames: e.target.value }))} />

            <div className="grid gap-2 sm:grid-cols-2">
              <Input label="DNI" value={student.dni} onChange={(e) => setStudent((p) => ({ ...p, dni: e.target.value }))} />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Género</label>
                <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={student.gender} onChange={(e) => setStudent((p) => ({ ...p, gender: e.target.value }))}>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Campus</label>
                <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={student.campusCode} onChange={(e) => setStudent((p) => ({ ...p, campusCode: e.target.value, classroomId: "", classroomLabel: "" }))}>
                  <option value="">Selecciona campus</option>
                  {CAMPUSES.map((campus) => <option key={campus} value={campus}>{campus}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nivel</label>
                <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={student.level} onChange={(e) => setStudent((p) => ({ ...p, level: e.target.value, classroomId: "", classroomLabel: "" }))}>
                  <option value="">Selecciona nivel</option>
                  {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
            </div>

            <p className="text-xs text-gray-600">Selecciona nivel y campus para ver los salones disponibles</p>

            {student.campusCode && student.level ? (
              <div className="space-y-2">
                {classroomQuery.isFetching ? <p className="text-sm text-gray-500">Cargando salones...</p> : null}
                {classroomQuery.isError ? <p className="text-sm text-red-700">No se pudo cargar salones disponibles.</p> : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  {classroomOptions.map((classroom) => {
                    const classroomId = classroom?.classroomId || classroom?.id || classroom?._id;
                    return (
                      <ClassroomOptionButton
                        key={classroomId || classroom?.label}
                        classroom={classroom}
                        isCurrent={false}
                        isSelected={String(student.classroomId || "") === String(classroomId || "")}
                        onSelect={(row) => setStudent((p) => ({
                          ...p,
                          classroomId: row?.classroomId || row?.id || row?._id || "",
                          classroomLabel: row?.label || row?.name || row?.displayName || "",
                        }))}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 sm:items-end">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Colegio anterior</label>
                <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={student.previousCampusMode} onChange={(e) => setStudent((p) => ({ ...p, previousCampusMode: e.target.value }))}>
                  <option value="CIENCIAS">CIENCIAS</option>
                  <option value="CIENCIAS_APLICADAS">CIENCIAS_APLICADAS</option>
                  <option value="CIMAS">CIMAS</option>
                  <option value="EXTERNO">Externo</option>
                </select>
              </div>
              <Input
                label="Nombre colegio"
                value={student.previousCampusInput}
                onChange={(e) => setStudent((p) => ({ ...p, previousCampusInput: e.target.value }))}
                disabled={student.previousCampusMode !== "EXTERNO"}
              />
            </div>

            {externalInvalid ? <p className="text-xs text-red-600">Si eliges Externo, ingresa al menos 2 caracteres.</p> : null}
          </>
        ) : (
          <>
            <Input label="Nombres" value={tutor.names} onChange={(e) => setTutor((prev) => ({ ...prev, names: e.target.value }))} />
            {tutorErrors.names ? <p className="text-xs text-red-600">{tutorErrors.names}</p> : null}

            <Input label="Apellidos" value={tutor.lastNames} onChange={(e) => setTutor((prev) => ({ ...prev, lastNames: e.target.value }))} />
            {tutorErrors.lastNames ? <p className="text-xs text-red-600">{tutorErrors.lastNames}</p> : null}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Input label="DNI" value={tutor.dni} onChange={(e) => setTutor((prev) => ({ ...prev, dni: e.target.value }))} />
                {tutorErrors.dni ? <p className="mt-1 text-xs text-red-600">{tutorErrors.dni}</p> : null}
              </div>
              <div>
                <Input label="Celular" value={tutor.phone} onChange={(e) => setTutor((prev) => ({ ...prev, phone: e.target.value }))} />
                {tutorErrors.phone ? <p className="mt-1 text-xs text-red-600">{tutorErrors.phone}</p> : null}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Género</label>
                <select className="w-full rounded border px-3 py-2 text-sm" value={tutor.gender} onChange={(e) => setTutor((prev) => ({ ...prev, gender: e.target.value }))}>
                  <option value="F">F</option>
                  <option value="M">M</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Relación</label>
                <select className="w-full rounded border px-3 py-2 text-sm" value={tutor.relationship} onChange={(e) => setTutor((prev) => ({ ...prev, relationship: e.target.value }))}>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked disabled />
                Es principal
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={tutor.livesWithStudent} onChange={(e) => setTutor((prev) => ({ ...prev, livesWithStudent: e.target.checked }))} />
                Vive con el/los alumnos
              </label>
            </div>
          </>
        )}

        {error ? <p className="text-sm text-amber-700">{error}</p> : null}
      </div>
    </BaseModal>
  );
}
