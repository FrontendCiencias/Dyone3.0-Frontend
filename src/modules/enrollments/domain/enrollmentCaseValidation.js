export const ENROLLMENT_CASE_MONTHS = ["Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function normalizeStartIndex(value) {
  const index = Number(value);
  if (Number.isNaN(index)) return 0;
  return Math.max(0, Math.min(9, Math.trunc(index)));
}

export function normalizePensionArray(input, fallbackValue = -1) {
  const source = Array.isArray(input) ? input : [];

  return Array.from({ length: 10 }).map((_, index) => {
    const raw = source[index];
    if (raw === null || raw === undefined || raw === "") return fallbackValue;

    const asNumber = Number(raw);
    if (Number.isNaN(asNumber)) return fallbackValue;
    return asNumber;
  });
}

export function buildPensionArrayFromGeneralAmount(amount, startIndex = 0) {
  const safeAmount = Number(amount);
  const normalizedAmount = Number.isNaN(safeAmount) ? 0 : safeAmount;
  const firstChargeIndex = normalizeStartIndex(startIndex);

  return Array.from({ length: 10 }).map((_, index) => (index < firstChargeIndex ? -1 : normalizedAmount));
}

export function applyStartIndexToPensionArray(values, startIndex = 0) {
  const base = normalizePensionArray(values, 0);
  const firstChargeIndex = normalizeStartIndex(startIndex);

  return base.map((value, index) => (index < firstChargeIndex ? -1 : value));
}

export function validateEnrollmentStudent(studentDraft = {}, capacityState = {}) {
  const errors = [];

  if (!studentDraft?.classroomId) {
    errors.push("Falta seleccionar salón.");
  }

  if (studentDraft?.classroomId) {
    if (capacityState?.isLoading) {
      errors.push("Aún se están consultando cupos del salón.");
    }

    if (capacityState?.isError) {
      errors.push("No se pudo consultar cupos del salón.");
    }

    const available = Number(capacityState?.available);
    if (!Number.isNaN(available) && available <= 0) {
      errors.push("El salón seleccionado no tiene cupos.");
    }
  }

  if (studentDraft?.previousSchoolType === "OTHER" && !String(studentDraft?.previousSchoolName || "").trim()) {
    errors.push("Debes indicar colegio de procedencia.");
  }

  const pensionMonthlyAmounts = normalizePensionArray(studentDraft?.pensionMonthlyAmounts, -1);

  if (!Array.isArray(studentDraft?.pensionMonthlyAmounts) || studentDraft.pensionMonthlyAmounts.length !== 10) {
    errors.push("La pensión mensual debe tener 10 meses (Mar-Dic).");
  }

  if (pensionMonthlyAmounts.some((value) => value === null || value === undefined || Number.isNaN(Number(value)))) {
    errors.push("Hay meses de pensión inválidos.");
  }

  return errors;
}

export function validateCase(caseDraft = {}, capacitiesByStudentId = {}) {
  const students = Array.isArray(caseDraft?.students) ? caseDraft.students : [];
  const errorsByStudentId = {};

  if (!caseDraft?.cycleId) {
    errorsByStudentId.__global = [...(errorsByStudentId.__global || []), "Selecciona ciclo."];
  }

  if (!caseDraft?.campusCode) {
    errorsByStudentId.__global = [...(errorsByStudentId.__global || []), "Selecciona campus."];
  }

  if (!caseDraft?.familyId) {
    errorsByStudentId.__global = [...(errorsByStudentId.__global || []), "Vincula una familia."];
  }

  if (!students.length) {
    errorsByStudentId.__global = [...(errorsByStudentId.__global || []), "Debes agregar al menos un alumno."];
  }

  students.forEach((student) => {
    const key = student?.localId || student?.id;
    const capacityState = capacitiesByStudentId?.[key] || {};
    const errors = validateEnrollmentStudent(student, capacityState);
    if (errors.length) errorsByStudentId[key] = errors;
  });

  const blockingReason = errorsByStudentId.__global?.[0]
    || Object.values(errorsByStudentId).flat()[0]
    || null;

  return {
    isValid: !blockingReason,
    errorsByStudentId,
    blockingReason,
  };
}
