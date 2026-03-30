import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import BaseModal from "../../../shared/ui/BaseModal";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { useCampusesQuery } from "../../admin/hooks/useCampusesQuery";
import { useCyclesQuery } from "../../admin/hooks/useCyclesQuery";
import { getClassroomOptions, getStudentSummary, searchStudents } from "../../students/services/students.service";
import { finalizeEnrollment, getEnrollmentDetail, searchTutorsForEnrollments } from "../services/enrollments.service";

const LEVEL_OPTIONS = [
  { value: "INITIAL", label: "Inicial" },
  { value: "PRIMARY", label: "Primaria" },
  { value: "SECONDARY", label: "Secundaria" },
];

const GRADE_OPTIONS = ["1", "2", "3", "4", "5", "6"];
const PREVIOUS_SCHOOL_OPTIONS = [
  { value: "CIMAS", label: "CIMAS" },
  { value: "CIENCIAS", label: "CIENCIAS" },
  { value: "CIENCIAS_APLICADAS", label: "CIENCIAS APLICADAS" },
  { value: "OTHER", label: "Otro colegio" },
];
const PENSION_MONTHS = ["Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

function emptyStudentDraft(activeCampusCode = "") {
  return {
    localId: `student-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode: "new",
    existingStudentId: "",
    fullName: "",
    names: "",
    lastNames: "",
    dni: "",
    gender: "M",
    previousSchoolType: "OTHER",
    previousSchoolName: "",
    level: "",
    grade: "",
    campusCode: activeCampusCode,
    classroomId: "",
    classroomLabel: "",
    notes: "",
    isBlocked: false,
    blockReason: "",
    existingSummary: null,
    inferredOnce: false,
    amounts: {
      admissionFeeAmount: "0",
      enrollmentFeeAmount: "0",
      pensionAmount: "0",
      pensionMonthlyAmounts: Array(10).fill("0"),
      useDetailedPensions: false,
    },
  };
}

function emptyTutorDraft() {
  return {
    localId: `tutor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode: "new",
    existingTutorId: "",
    relationship: "Apoderado",
    names: "",
    lastNames: "",
    dni: "",
    phone: "",
    isLegalResponsible: true,
    includeInContract: true,
    linkedStudentIds: [],
    source: "manual",
  };
}

function tutorIdentityKey(tutor = {}) {
  const byExistingId = String(tutor.existingTutorId || tutor.personId || "").trim();
  if (byExistingId) return `person:${byExistingId}`;

  const dni = String(tutor.dni || "").trim();
  if (dni) return `dni:${dni}`;

  return `name:${String(tutor.names || "").trim().toLowerCase()}::${String(tutor.lastNames || "").trim().toLowerCase()}`;
}

function formatStudentLabel(student) {
  const lastNames = student?.lastNames || student?.personId?.lastNames || "";
  const names = student?.names || student?.personId?.names || "";
  return [lastNames, names].filter(Boolean).join(", ");
}

function getErrorMessage(error, fallback) {
  const message = error?.response?.data?.message || error?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return fallback;
}

function isRemoteValidationRecoverable(error) {
  const status = Number(error?.response?.status || 0);
  if (!status) return true;
  return status >= 500 || status === 401 || status === 403;
}

function buildContractPayload({ activeCampus, students, tutors, observations }) {
  return {
    enrollmentId: "",
    campus: activeCampus || "",
    city: "Majes",
    generatedAt: new Date().toISOString(),
    tutorContext: { address: observations.address || "" },
    family: { address: observations.address || "" },
    tutors: tutors
      .filter((tutor) => tutor.includeInContract)
      .map((tutor) => ({
        relationship: tutor.relationship || "Apoderado",
        tutorPerson: {
          names: tutor.names,
          lastNames: tutor.lastNames,
          dni: tutor.dni,
          phone: tutor.phone,
        },
      })),
    items: students.map((student) => ({
      previousSchoolType: student.previousSchoolType,
      previousSchoolName: student.previousSchoolName,
      fullName: [student.lastNames, student.names].filter(Boolean).join(", "),
      campusCode: student.campusCode,
      classroomLabel: student.classroomLabel,
      grade: student.grade,
      level: student.level,
      dni: student.dni,
      admissionFee: {
        applies: student.previousSchoolType === "OTHER",
        isExempt: false,
        amount: student.previousSchoolType === "OTHER" ? Number(student.amounts.admissionFeeAmount || 0) : 0,
      },
      enrollmentFee: {
        isExempt: false,
        amount: Number(student.amounts.enrollmentFeeAmount || 0),
      },
      pensionMonthlyAmounts: student.amounts.useDetailedPensions
        ? student.amounts.pensionMonthlyAmounts.map((amount) => Number(amount || 0))
        : Array(10).fill(Number(student.amounts.pensionAmount || 0)),
    })),
    payments: { notes: observations.general },
  };
}

function formatDraftStudentName(student = {}) {
  return student.fullName || [student.lastNames, student.names].filter(Boolean).join(", ") || "Alumno";
}

function compactOptionalId(value) {
  const normalized = String(value || "").trim();
  return normalized || undefined;
}

function normalizeStudentDni(value) {
  return String(value || "").replace(/\D/g, "").trim();
}

function sanitizeDniInput(value) {
  return normalizeStudentDni(value).slice(0, 8);
}

function isValidDni(value) {
  return normalizeStudentDni(value).length === 8;
}

function isStudentReady(student = {}) {
  const requiresDni = student.mode === "existing" && !isValidDni(student.dni);
  return Boolean(
    !student.isBlocked
    && !requiresDni
    && String(student.names || "").trim()
    && String(student.lastNames || "").trim()
    && student.previousSchoolType
    && (student.previousSchoolType !== "OTHER" || String(student.previousSchoolName || "").trim())
    && student.campusCode
    && student.level
    && student.grade
    && student.classroomId
    && String(student.classroomLabel || "").trim()
  );
}

function normalizePreviousSchoolDraft(previousCampus) {
  const normalized = String(previousCampus || "").trim().toUpperCase();
  if (["CIMAS", "CIENCIAS", "CIENCIAS_APLICADAS"].includes(normalized)) {
    return {
      previousSchoolType: normalized,
      previousSchoolName: "",
    };
  }

  return {
    previousSchoolType: "OTHER",
    previousSchoolName: String(previousCampus || "").trim(),
  };
}

function isExistingStudentAlreadyEnrolled(student = {}) {
  const directStatus = String(student?.enrollmentStatus || "").trim().toUpperCase();
  const nestedStatus = String(
    student?.currentEnrollment?.status
    || student?.currentEnrollment?.enrollment?.status
    || student?.enrollmentStatus?.status
    || student?.enrollmentStatus?.cycle?.status
    || ""
  ).trim().toUpperCase();

  return ["ENROLLED", "CONFIRMED"].includes(directStatus) || ["ENROLLED", "CONFIRMED"].includes(nestedStatus);
}

function isStudentSummaryAlreadyEnrolled(summary = {}) {
  const currentStatus = String(
    summary?.currentEnrollment?.status
    || summary?.currentEnrollment?.enrollment?.status
    || summary?.enrollmentStatus?.status
    || summary?.enrollmentStatus?.cycle?.status
    || ""
  ).trim().toUpperCase();

  return ["ENROLLED", "CONFIRMED"].includes(currentStatus);
}

function toAmountString(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0";
  if (parsed <= 0) return "0";
  return String(parsed);
}

function normalizePensionDraft(values = []) {
  const source = Array.isArray(values) ? values : [];
  const normalized = Array.from({ length: 10 }, (_, index) => {
    const raw = Number(source[index] ?? 0);
    if (!Number.isFinite(raw) || raw < 0) return 0;
    return raw;
  });

  const first = normalized[0] ?? 0;
  const useDetailedPensions = normalized.some((value) => value !== first);

  return {
    pensionAmount: toAmountString(first),
    pensionMonthlyAmounts: normalized.map((value) => toAmountString(value)),
    useDetailedPensions,
  };
}

export default function MatriculasV2Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeCampus } = useAuth();
  const cyclesQuery = useCyclesQuery();
  const campusesQuery = useCampusesQuery();
  const steps = [
    { id: 1, label: "Alumnos" },
    { id: 2, label: "Tutores" },
    { id: 3, label: "Montos" },
    { id: 4, label: "Observaciones" },
  ];

  const [currentStep, setCurrentStep] = useState(1);
  const [statusMessage, setStatusMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [manualStudentErrors, setManualStudentErrors] = useState({});
  const [manualTutorErrors, setManualTutorErrors] = useState({});
  const [stepOneFlashIds, setStepOneFlashIds] = useState([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [personalEdit, setPersonalEdit] = useState({ open: false, localId: "", names: "", lastNames: "", dni: "", error: "" });
  const [tutorEdit, setTutorEdit] = useState({
    open: false,
    localId: "",
    names: "",
    lastNames: "",
    dni: "",
    phone: "",
    relationship: "Apoderado",
    error: "",
  });
  const [academicEdit, setAcademicEdit] = useState({
    open: false,
    localId: "",
    previousSchoolType: "OTHER",
    previousSchoolName: "",
    campusCode: "",
    level: "",
    grade: "",
    classroomId: "",
    error: "",
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [manualStudent, setManualStudent] = useState(() => emptyStudentDraft(activeCampus || ""));
  const [studentsDraft, setStudentsDraft] = useState([]);
  const [tutorSearch, setTutorSearch] = useState("");
  const [tutorResults, setTutorResults] = useState([]);
  const [isSearchingTutors, setIsSearchingTutors] = useState(false);
  const [manualTutor, setManualTutor] = useState(() => emptyTutorDraft());
  const [tutorsDraft, setTutorsDraft] = useState([]);
  const [observations, setObservations] = useState({ general: "", address: "" });
  const [completedEnrollment, setCompletedEnrollment] = useState(null);
  const manualStudentDniRef = useRef(null);
  const manualTutorDniRef = useRef(null);
  const resumeHydratedRef = useRef(false);
  const finalizeMutation = useMutation({
    mutationFn: finalizeEnrollment,
    onError: (error) => {
      setStatusMessage(getErrorMessage(error, "No se pudo registrar la matrícula."));
    },
  });

  const campuses = useMemo(() => {
    const rows = Array.isArray(campusesQuery.data?.items)
      ? campusesQuery.data.items
      : Array.isArray(campusesQuery.data)
        ? campusesQuery.data
        : [];

    return rows.map((row) => ({
      id: row.id || row._id,
      code: row.code || row.campusCode,
      name: row.name || row.code || row.campusCode,
    }));
  }, [campusesQuery.data]);

  const activeCycle = useMemo(() => {
    const rows = Array.isArray(cyclesQuery.data?.items)
      ? cyclesQuery.data.items
      : Array.isArray(cyclesQuery.data)
        ? cyclesQuery.data
        : [];
    return rows.find((row) => row?.isActive) || null;
  }, [cyclesQuery.data]);

  const resumeEnrollmentId = useMemo(() => {
    const value = String(searchParams.get("resumeEnrollmentId") || "").trim();
    return value || "";
  }, [searchParams]);
  const isResumeMode = Boolean(resumeEnrollmentId);

  const resumeEnrollmentQuery = useQuery({
    queryKey: ["enrollments", "resume", resumeEnrollmentId],
    queryFn: () => getEnrollmentDetail(resumeEnrollmentId),
    enabled: isResumeMode,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    resumeHydratedRef.current = false;
  }, [resumeEnrollmentId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isResumeMode) return;
    if (resumeHydratedRef.current) return;
    if (resumeEnrollmentQuery.isLoading || !resumeEnrollmentQuery.data) return;

    const detail = resumeEnrollmentQuery.data;
    const status = String(detail?.status || "").toUpperCase();
    if (status !== "ABSENT") {
      resumeHydratedRef.current = true;
      setStatusMessage("Solo se puede reanudar desde matrículas en estado Ausente.");
      return;
    }

    const detailStudents = Array.isArray(detail.students) ? detail.students : [];
    const seededStudents = detailStudents.map((student, index) => {
      const localId = `resume-student-${student.studentId || student.enrollmentStudentId || index + 1}`;
      const pensionsDraft = normalizePensionDraft(student.pensionMonthlyAmounts);
      const previousSchoolType = student.previousSchoolType || "OTHER";
      const previousSchoolName = previousSchoolType === "OTHER" ? (student.previousSchoolName || "") : "";

      return {
        localId,
        mode: "existing",
        existingStudentId: student.studentId || "",
        fullName: student.fullName || [student.lastNames, student.names].filter(Boolean).join(", "),
        names: student.names || "",
        lastNames: student.lastNames || "",
        dni: student.dni || "",
        gender: "M",
        previousSchoolType,
        previousSchoolName,
        level: "",
        grade: "",
        campusCode: detail?.campus?.code || activeCampus || "",
        classroomId: student.classroom?.id || "",
        classroomLabel: student.classroom?.displayName || "",
        notes: student.notes || "",
        isBlocked: false,
        blockReason: "",
        existingSummary: null,
        inferredOnce: false,
        amounts: {
          admissionFeeAmount: toAmountString(student?.admissionFee?.amount),
          enrollmentFeeAmount: toAmountString(student?.enrollmentFee?.amount),
          ...pensionsDraft,
        },
      };
    });

    const allStudentIds = seededStudents.map((student) => student.localId);
    const detailTutors = Array.isArray(detail.tutors) ? detail.tutors : [];
    const seededTutors = detailTutors.map((tutor, index) => ({
      localId: `resume-tutor-${tutor.personId || tutor.dni || index + 1}`,
      mode: "existing-related",
      existingTutorId: tutor.personId || "",
      personId: tutor.personId || "",
      relationship: tutor.relationship || "Apoderado",
      names: tutor.names || "",
      lastNames: tutor.lastNames || "",
      dni: tutor.dni || "",
      phone: tutor.phone || "",
      isLegalResponsible: true,
      includeInContract: true,
      linkedStudentIds: allStudentIds,
      source: "resume-enrollment",
    }));

    setCompletedEnrollment(null);
    setCurrentStep(1);
    setStudentsDraft(seededStudents);
    setTutorsDraft(seededTutors);
    setObservations({
      general: detail?.notes || detail?.contract?.notes || "",
      address: detail?.contract?.address || "",
    });
    setStudentSearch("");
    setStudentResults([]);
    setTutorSearch("");
    setTutorResults([]);
    setManualStudent(emptyStudentDraft(activeCampus || detail?.campus?.code || ""));
    setManualTutor(emptyTutorDraft());
    setStatusMessage("Se cargó la matrícula ausente. Completa los datos faltantes y presiona Matricular.");
    resumeHydratedRef.current = true;
  }, [
    isResumeMode,
    resumeEnrollmentQuery.isLoading,
    resumeEnrollmentQuery.data,
    activeCampus,
  ]);

  useEffect(() => {
    const term = String(studentSearch || "").trim();
    if (term.length < 2) {
      setStudentResults([]);
      return undefined;
    }

    let cancelled = false;
    setIsSearchingStudents(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await searchStudents({ q: term, limit: 8 });
        if (cancelled) return;
        const items = Array.isArray(response?.items) ? response.items : [];
        console.log("[MatriculasV2][StudentSearch][RESULT]", {
          query: term,
          response,
          items,
        });
        setStudentResults(items);
      } catch (error) {
        if (!cancelled) setStatusMessage(getErrorMessage(error, "No se pudo buscar alumnos"));
      } finally {
        if (!cancelled) setIsSearchingStudents(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [studentSearch]);

  useEffect(() => {
    const term = String(tutorSearch || "").trim();
    if (term.length < 2) {
      setTutorResults([]);
      return undefined;
    }

    let cancelled = false;
    setIsSearchingTutors(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await searchTutorsForEnrollments({ q: term, limit: 8 });
        if (cancelled) return;
        const items = Array.isArray(response?.items) ? response.items : [];
        setTutorResults(items);
      } catch (error) {
        if (!cancelled) setStatusMessage(getErrorMessage(error, "No se pudo buscar tutores"));
      } finally {
        if (!cancelled) setIsSearchingTutors(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [tutorSearch]);

  const studentSummaryQueries = useQueries({
    queries: studentsDraft
      .filter((student) => student.mode === "existing" && student.existingStudentId)
      .map((student) => ({
        queryKey: ["students", "summary", student.existingStudentId, "matriculas-v2"],
        queryFn: () => getStudentSummary(student.existingStudentId),
        enabled: true,
        staleTime: 60_000,
      })),
  });

  const studentSummaryMap = useMemo(() => {
    const entries = studentsDraft.filter((student) => student.mode === "existing" && student.existingStudentId);
    const map = new Map();
    entries.forEach((student, index) => {
      map.set(student.existingStudentId, studentSummaryQueries[index]?.data || null);
    });
    return map;
  }, [studentsDraft, studentSummaryQueries]);

  useEffect(() => {
    setStudentsDraft((prev) => {
      let changed = false;

      const next = prev.map((student) => {
        if (student.mode !== "existing" || !student.existingStudentId) return student;
        if (student.inferredOnce) return student;
        const summary = studentSummaryMap.get(student.existingStudentId);
        if (!summary) return student;

        const currentEnrollment = summary?.currentEnrollment || summary?.enrollmentStatus || {};
        const suggestedCampus = currentEnrollment?.campus?.code || student.campusCode;
        const suggestedLevel = currentEnrollment?.classroom?.level || student.level;
        const suggestedGrade = currentEnrollment?.classroom?.grade || student.grade;
        const suggestedClassroomId = currentEnrollment?.classroom?.id || student.classroomId;
        const suggestedClassroomLabel = currentEnrollment?.classroom?.displayName || student.classroomLabel;
        const previousSchoolDraft = normalizePreviousSchoolDraft(summary?.student?.previousCampus);

        const nextStudent = {
          ...student,
          campusCode: suggestedCampus,
          level: suggestedLevel,
          grade: suggestedGrade,
          classroomId: suggestedClassroomId,
          classroomLabel: suggestedClassroomLabel,
          previousSchoolType: previousSchoolDraft.previousSchoolType,
          previousSchoolName: previousSchoolDraft.previousSchoolName,
          inferredOnce: true,
        };

        const didChange = (
          nextStudent.campusCode !== student.campusCode
          || nextStudent.level !== student.level
          || nextStudent.grade !== student.grade
          || nextStudent.classroomId !== student.classroomId
          || nextStudent.classroomLabel !== student.classroomLabel
          || nextStudent.previousSchoolType !== student.previousSchoolType
          || nextStudent.previousSchoolName !== student.previousSchoolName
        );

        if (didChange) {
          changed = true;
          return nextStudent;
        }

        return student;
      });

      return changed ? next : prev;
    });
  }, [studentSummaryMap]);

  const classroomQueries = useQueries({
    queries: studentsDraft.map((student) => ({
      queryKey: ["classroom-options", "matriculas-v2", student.localId, student.level, student.grade, student.campusCode],
      queryFn: () => getClassroomOptions({
        level: student.level,
        grade: student.grade,
        campus: student.campusCode,
        includeCapacity: true,
      }),
      enabled: Boolean(student.level && student.grade && student.campusCode),
      retry: false,
      staleTime: 60_000,
    })),
  });

  const classroomOptionsByStudent = useMemo(() => {
    const map = new Map();
    studentsDraft.forEach((student, index) => {
      const rows = Array.isArray(classroomQueries[index]?.data?.items)
        ? classroomQueries[index].data.items
        : Array.isArray(classroomQueries[index]?.data)
          ? classroomQueries[index].data
          : [];
      map.set(student.localId, rows);
    });
    return map;
  }, [studentsDraft, classroomQueries]);

  const academicClassroomOptionsQuery = useQuery({
    queryKey: ["classroom-options", "matriculas-v2", "modal", academicEdit.campusCode, academicEdit.level, academicEdit.grade],
    queryFn: () => getClassroomOptions({
      level: academicEdit.level,
      grade: academicEdit.grade,
      campus: academicEdit.campusCode,
      includeCapacity: true,
    }),
    enabled: academicEdit.open && Boolean(academicEdit.level && academicEdit.grade && academicEdit.campusCode),
    retry: false,
    staleTime: 60_000,
  });

  const academicClassroomOptions = useMemo(() => {
    const rows = Array.isArray(academicClassroomOptionsQuery.data?.items)
      ? academicClassroomOptionsQuery.data.items
      : Array.isArray(academicClassroomOptionsQuery.data)
        ? academicClassroomOptionsQuery.data
        : [];
    return rows;
  }, [academicClassroomOptionsQuery.data]);

  const relatedTutorDniSet = useMemo(() => {
    const dniSet = new Set();

    studentsDraft.forEach((student) => {
      if (student.mode !== "existing" || !student.existingStudentId) return;
      const summary = studentSummaryMap.get(student.existingStudentId);
      const tutorLink = summary?.tutorLink || summary?.familyLink || {};
      const primaryTutor = tutorLink?.primaryTutor || tutorLink?.primaryTutor_send;
      const otherTutors = Array.isArray(tutorLink?.otherTutors)
        ? tutorLink.otherTutors
        : Array.isArray(tutorLink?.otherTutors_send)
          ? tutorLink.otherTutors_send
          : [];

      [primaryTutor, ...otherTutors]
        .filter(Boolean)
        .forEach((tutor) => {
          const dni = normalizeStudentDni(tutor.dni);
          if (dni) dniSet.add(dni);
        });
    });

    return dniSet;
  }, [studentSummaryMap, studentsDraft]);

  useEffect(() => {
    const suggestedTutors = [];

    studentsDraft.forEach((student) => {
      if (student.mode !== "existing" || !student.existingStudentId) return;
      const summary = studentSummaryMap.get(student.existingStudentId);
      const tutorLink = summary?.tutorLink || summary?.familyLink || {};
      const primaryTutor = tutorLink?.primaryTutor || tutorLink?.primaryTutor_send;
      const otherTutors = Array.isArray(tutorLink?.otherTutors)
        ? tutorLink.otherTutors
        : Array.isArray(tutorLink?.otherTutors_send)
          ? tutorLink.otherTutors_send
          : [];
      [primaryTutor, ...otherTutors].filter(Boolean).forEach((tutor) => {
        suggestedTutors.push({
          localId: `suggested-${student.existingStudentId}-${tutor.personId || tutor.dni || tutor.phone || tutor.names}`,
          mode: "existing-related",
          existingTutorId: tutor.personId || "",
          personId: tutor.personId || "",
          relationship: tutor.relationship || "Apoderado",
          names: tutor.names || "",
          lastNames: tutor.lastNames || "",
          dni: tutor.dni || "",
          phone: tutor.phone || "",
          isLegalResponsible: true,
          includeInContract: true,
          linkedStudentIds: [student.localId],
          source: "student-summary",
        });
      });
    });

    setTutorsDraft((prev) => {
      let changed = false;
      const next = [...prev];

      suggestedTutors.forEach((suggestedTutor) => {
        const key = tutorIdentityKey(suggestedTutor);
        const existingIndex = next.findIndex((row) => tutorIdentityKey(row) === key);

        if (existingIndex === -1) {
          next.push(suggestedTutor);
          changed = true;
          return;
        }

        const current = next[existingIndex];
        const mergedStudentIds = [...new Set([...(current.linkedStudentIds || []), ...(suggestedTutor.linkedStudentIds || [])])];
        if (mergedStudentIds.length !== (current.linkedStudentIds || []).length) {
          next[existingIndex] = { ...current, linkedStudentIds: mergedStudentIds };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [studentSummaryMap, studentsDraft]);

  useEffect(() => {
    const allStudentIds = studentsDraft.map((student) => student.localId);

    setTutorsDraft((prev) => {
      let changed = false;
      const next = prev.map((tutor) => {
        const currentIds = Array.isArray(tutor.linkedStudentIds) ? tutor.linkedStudentIds : [];
        const sameLength = currentIds.length === allStudentIds.length;
        const sameValues = sameLength && currentIds.every((studentId, index) => studentId === allStudentIds[index]);
        if (sameValues) return tutor;
        changed = true;
        return { ...tutor, linkedStudentIds: allStudentIds };
      });
      return changed ? next : prev;
    });
  }, [studentsDraft]);

  const enabledTutorCount = tutorsDraft.filter((tutor) => tutor.includeInContract).length;
  const hasBlockedStudent = studentsDraft.some((student) => student.isBlocked);
  const hasStudentWithoutClassroom = studentsDraft.some((student) => !student.classroomId);
  const hasContactAddress = Boolean(String(observations.address || "").trim());
  const incompleteStepOneStudentIds = studentsDraft
    .filter((student) => !isStudentReady(student))
    .map((student) => student.localId);
  const canPreview = studentsDraft.length > 0 && enabledTutorCount > 0 && hasContactAddress;
  const canSubmit = Boolean(activeCycle?._id || activeCycle?.id)
    && studentsDraft.length > 0
    && enabledTutorCount > 0
    && !hasBlockedStudent
    && !hasStudentWithoutClassroom
    && hasContactAddress;
  const canContinueFromStudents = studentsDraft.length > 0 && incompleteStepOneStudentIds.length === 0;
  const canContinueFromTutors = tutorsDraft.length > 0 && enabledTutorCount > 0;

  async function addExistingStudent(student) {
    const studentId = student.id || student._id;
    const studentDni = normalizeStudentDni(student.dni || student.personId?.dni);
    if (!studentId) return;
    if (isExistingStudentAlreadyEnrolled(student)) {
      setStatusMessage("Este alumno ya se matriculó y no puede volver a seleccionarse.");
      setToast({ type: "error", message: "Este alumno ya se matriculó." });
      return;
    }
    try {
      const summary = await getStudentSummary(studentId);
      if (isStudentSummaryAlreadyEnrolled(summary)) {
        setStatusMessage("Este alumno ya se matriculó y no puede volver a seleccionarse.");
        setToast({ type: "error", message: "Este alumno ya se matriculó." });
        return;
      }
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "No se pudo validar el estado actual del alumno."));
      setToast({ type: "error", message: "No se pudo validar si el alumno ya está matriculado." });
      return;
    }
    if (studentsDraft.some((row) => row.existingStudentId === studentId)) return;
    if (studentDni && relatedTutorDniSet.has(studentDni)) {
      setStatusMessage("Ese DNI ya pertenece a un tutor relacionado con los alumnos seleccionados.");
      setToast({ type: "error", message: "El DNI ingresado ya pertenece a un tutor relacionado con esta matrícula." });
      return;
    }
    if (studentDni && tutorsDraft.some((tutor) => normalizeStudentDni(tutor.dni) === studentDni)) {
      setStatusMessage("Ese DNI ya fue usado por un tutor en esta matrícula.");
      setToast({ type: "error", message: "El DNI ingresado ya pertenece a un tutor de esta matrícula." });
      return;
    }
    if (studentDni && studentsDraft.some((row) => normalizeStudentDni(row.dni) === studentDni)) {
      setStatusMessage("Ya existe un alumno con ese DNI en la matrícula.");
      setToast({ type: "error", message: "El DNI ya se encuentra en uso en esta matrícula." });
      return;
    }

    const blocked = isExistingStudentAlreadyEnrolled(student);
    setStudentsDraft((prev) => [
      ...prev,
      {
        localId: `existing-${studentId}`,
        mode: "existing",
        existingStudentId: studentId,
        names: student.names || student.personId?.names || "",
        lastNames: student.lastNames || student.personId?.lastNames || "",
        fullName: formatStudentLabel(student),
        dni: student.dni || student.personId?.dni || "",
        gender: student.gender || student.personId?.gender || "M",
        level: "",
        grade: "",
        campusCode: activeCampus || "",
        classroomId: "",
        classroomLabel: "",
        notes: "",
        isBlocked: blocked,
        blockReason: blocked ? "Este alumno ya se matriculo" : "",
        existingSummary: null,
        inferredOnce: false,
        amounts: {
          admissionFeeAmount: "0",
          enrollmentFeeAmount: "0",
          pensionAmount: "0",
          pensionMonthlyAmounts: Array(10).fill("0"),
          useDetailedPensions: false,
        },
      },
    ]);
    setStudentSearch("");
    setStudentResults([]);
  }

  async function addManualStudent() {
    setManualStudentErrors({});

    if (!manualStudent.names.trim() || !manualStudent.lastNames.trim()) {
      setStatusMessage("Completa nombres y apellidos del alumno.");
      return;
    }

    const normalizedDni = normalizeStudentDni(manualStudent.dni);
    if (manualStudent.dni && !isValidDni(manualStudent.dni)) {
      setStatusMessage("El DNI del alumno debe tener 8 dígitos numéricos.");
      setToast({ type: "error", message: "El DNI del alumno debe tener exactamente 8 números." });
      setManualStudentErrors({ dni: "El DNI debe tener exactamente 8 números." });
      manualStudentDniRef.current?.focus();
      return;
    }

    if (normalizedDni && relatedTutorDniSet.has(normalizedDni)) {
      setStatusMessage("Ese DNI ya pertenece a un tutor relacionado con los alumnos seleccionados.");
      setToast({ type: "error", message: "El DNI ingresado ya pertenece a un tutor relacionado con esta matrícula." });
      setManualStudentErrors({ dni: "Este DNI ya pertenece a un tutor relacionado con esta matrícula." });
      manualStudentDniRef.current?.focus();
      return;
    }
    if (normalizedDni && tutorsDraft.some((tutor) => normalizeStudentDni(tutor.dni) === normalizedDni)) {
      setStatusMessage("Ese DNI ya fue usado por un tutor en esta matrícula.");
      setToast({ type: "error", message: "El DNI ingresado ya pertenece a un tutor de esta matrícula." });
      setManualStudentErrors({ dni: "Este DNI ya pertenece a un tutor de esta matrícula." });
      manualStudentDniRef.current?.focus();
      return;
    }

    if (normalizedDni && studentsDraft.some((student) => normalizeStudentDni(student.dni) === normalizedDni)) {
      setStatusMessage("Ya existe un alumno con ese DNI en la matrícula.");
      setToast({ type: "error", message: "El DNI ya se encuentra en uso en esta matrícula." });
      setManualStudentErrors({ dni: "Este DNI ya fue agregado a la matrícula." });
      manualStudentDniRef.current?.focus();
      return;
    }

    if (normalizedDni) {
      try {
        const response = await searchStudents({ q: normalizedDni, limit: 5 });
        const items = Array.isArray(response?.items) ? response.items : [];
        const duplicatedInDb = items.some((student) => normalizeStudentDni(student.dni || student.personId?.dni) === normalizedDni);
        if (duplicatedInDb) {
          setStatusMessage("Ya existe un alumno registrado con ese DNI.");
          setToast({ type: "error", message: "El DNI ya se encuentra en uso por otro alumno." });
          setManualStudentErrors({ dni: "Este DNI ya está registrado en la base de datos." });
          manualStudentDniRef.current?.focus();
          return;
        }
      } catch (error) {
        if (!isRemoteValidationRecoverable(error)) {
          setStatusMessage(getErrorMessage(error, "No se pudo validar el DNI del alumno."));
          setToast({ type: "error", message: "No se pudo validar el DNI del alumno." });
          return;
        }
        setStatusMessage("No se pudo validar el DNI del alumno contra base en este momento. Se aplicará validación local.");
      }
    }

    setStudentsDraft((prev) => [...prev, { ...manualStudent, fullName: `${manualStudent.lastNames}, ${manualStudent.names}` }]);
    setManualStudent(emptyStudentDraft(activeCampus || ""));
    setManualStudentErrors({});
    setStatusMessage("");
  }

  function validateDraftStudentDni(localId, rawDni) {
    const normalizedDni = normalizeStudentDni(rawDni);
    if (!normalizedDni) return "";

    const duplicatedStudent = studentsDraft.some((student) => (
      student.localId !== localId && normalizeStudentDni(student.dni) === normalizedDni
    ));
    if (duplicatedStudent) {
      return "Este DNI ya fue usado por otro alumno de esta matrícula.";
    }

    const duplicatedTutor = tutorsDraft.some((tutor) => normalizeStudentDni(tutor.dni) === normalizedDni);
    if (duplicatedTutor) {
      return "Este DNI ya pertenece a un tutor de esta matrícula.";
    }

    if (relatedTutorDniSet.has(normalizedDni)) {
      return "Este DNI ya pertenece a un tutor relacionado con esta matrícula.";
    }

    return "";
  }

  function validateDraftTutorDni(localId, rawDni) {
    const normalizedDni = normalizeStudentDni(rawDni);
    if (!normalizedDni) return "";

    const duplicatedStudent = studentsDraft.some((student) => normalizeStudentDni(student.dni) === normalizedDni);
    if (duplicatedStudent) {
      return "Este DNI ya pertenece a un alumno de esta matrícula.";
    }

    const duplicatedTutor = tutorsDraft.some((tutor) => (
      tutor.localId !== localId && normalizeStudentDni(tutor.dni) === normalizedDni
    ));
    if (duplicatedTutor) {
      return "Este DNI ya fue usado por otro tutor de esta matrícula.";
    }

    return "";
  }

  function updateStudent(localId, patch) {
    if (patch.dni !== undefined) {
      const dniError = validateDraftStudentDni(localId, patch.dni);
      if (dniError) {
        setStatusMessage(dniError);
        setToast({ type: "error", message: dniError });
        return false;
      }
    }

    setStudentsDraft((prev) => prev.map((student) => {
      if (student.localId !== localId) return student;
      const next = { ...student, ...patch };
      if (patch.previousSchoolType !== undefined && patch.previousSchoolType !== "OTHER") {
        next.previousSchoolName = "";
      }
      if (patch.classroomId !== undefined) {
        if (patch.classroomLabel === undefined) {
          const classroomOptions = classroomOptionsByStudent.get(localId) || [];
          const classroom = classroomOptions.find((row) => String(row.classroomId || row.id || row._id) === String(patch.classroomId));
          next.classroomLabel = classroom?.label || classroom?.displayName || "";
        }
      }
      if (patch.previousSchoolType !== undefined && patch.previousSchoolType !== "OTHER") {
        next.amounts = {
          ...next.amounts,
          admissionFeeAmount: "0",
        };
      }
      return next;
    }));
    return true;
  }

  function updateStudentAmount(localId, field, value) {
    setStudentsDraft((prev) => prev.map((student) => (
      student.localId === localId
        ? {
          ...student,
          amounts: {
            ...student.amounts,
            [field]: value,
            ...(field === "pensionAmount" && !student.amounts.useDetailedPensions
              ? { pensionMonthlyAmounts: Array(10).fill(String(value ?? "0")) }
              : {}),
          },
        }
        : student
    )));
  }

  function toggleDetailedPensions(localId, enabled) {
    setStudentsDraft((prev) => prev.map((student) => {
      if (student.localId !== localId) return student;
      const nextGeneral = String(student.amounts.pensionAmount || "0");
      return {
        ...student,
        amounts: {
          ...student.amounts,
          useDetailedPensions: enabled,
          pensionMonthlyAmounts: enabled
            ? (student.amounts.pensionMonthlyAmounts?.length === 10
              ? student.amounts.pensionMonthlyAmounts
              : Array(10).fill(nextGeneral))
            : Array(10).fill(nextGeneral),
        },
      };
    }));
  }

  function removeStudent(localId) {
    const remainingStudentIds = studentsDraft
      .filter((student) => student.localId !== localId)
      .map((student) => student.localId);

    setStudentsDraft((prev) => prev.filter((student) => student.localId !== localId));
    setTutorsDraft((prev) => prev.map((tutor) => ({
      ...tutor,
      linkedStudentIds: remainingStudentIds,
    })));
  }

  function openPersonalEdit(student) {
    setPersonalEdit({
      open: true,
      localId: student.localId,
      names: student.names || "",
      lastNames: student.lastNames || "",
      dni: student.dni || "",
      error: "",
    });
  }

  function closePersonalEdit() {
    setPersonalEdit({ open: false, localId: "", names: "", lastNames: "", dni: "", error: "" });
  }

  async function savePersonalEdit() {
    const names = String(personalEdit.names || "").trim();
    const lastNames = String(personalEdit.lastNames || "").trim();
    const dni = sanitizeDniInput(personalEdit.dni);
    const currentStudent = studentsDraft.find((student) => student.localId === personalEdit.localId);

    if (!names || !lastNames) {
      setPersonalEdit((prev) => ({ ...prev, error: "Completa nombres y apellidos del alumno." }));
      return;
    }

    if (!isValidDni(dni)) {
      setPersonalEdit((prev) => ({ ...prev, error: "El DNI debe tener exactamente 8 números." }));
      return;
    }

    const dniError = validateDraftStudentDni(personalEdit.localId, dni);
    if (dniError) {
      setPersonalEdit((prev) => ({ ...prev, error: dniError }));
      return;
    }

    try {
      const [studentResponse, tutorResponse] = await Promise.all([
        searchStudents({ q: dni, limit: 5 }),
        searchTutorsForEnrollments({ q: dni, limit: 5 }),
      ]);

      const studentItems = Array.isArray(studentResponse?.items) ? studentResponse.items : [];
      const tutorItems = Array.isArray(tutorResponse?.items) ? tutorResponse.items : [];

      const duplicatedStudentInDb = studentItems.some((student) => {
        const sameDni = normalizeStudentDni(student.dni || student.personId?.dni) === dni;
        if (!sameDni) return false;
        if (currentStudent?.mode === "existing" && currentStudent?.existingStudentId) {
          return String(student.id || student._id) !== String(currentStudent.existingStudentId);
        }
        return true;
      });

      if (duplicatedStudentInDb) {
        setPersonalEdit((prev) => ({ ...prev, error: "Ese DNI ya pertenece a otro alumno registrado." }));
        return;
      }

      const duplicatedTutorInDb = tutorItems.some((tutor) => normalizeStudentDni(tutor.dni) === dni);
      if (duplicatedTutorInDb) {
        setPersonalEdit((prev) => ({ ...prev, error: "Ese DNI ya pertenece a un tutor registrado." }));
        return;
      }
    } catch (error) {
      if (!isRemoteValidationRecoverable(error)) {
        setPersonalEdit((prev) => ({ ...prev, error: getErrorMessage(error, "No se pudo validar el DNI del alumno.") }));
        return;
      }
      setStatusMessage("No se pudo validar el DNI del alumno contra base en este momento. Se aplicará validación local.");
    }

    const didUpdate = updateStudent(personalEdit.localId, {
      names,
      lastNames,
      fullName: `${lastNames}, ${names}`,
      dni,
    });

    if (didUpdate !== false) {
      closePersonalEdit();
    }
  }

  function openAcademicEdit(student) {
    setAcademicEdit({
      open: true,
      localId: student.localId,
      previousSchoolType: student.previousSchoolType || "OTHER",
      previousSchoolName: student.previousSchoolName || "",
      campusCode: student.campusCode || "",
      level: student.level || "",
      grade: student.grade || "",
      classroomId: student.classroomId || "",
      error: "",
    });
  }

  function closeAcademicEdit() {
    setAcademicEdit({
      open: false,
      localId: "",
      previousSchoolType: "OTHER",
      previousSchoolName: "",
      campusCode: "",
      level: "",
      grade: "",
      classroomId: "",
      error: "",
    });
  }

  function saveAcademicEdit() {
    if (!academicEdit.previousSchoolType) {
      setAcademicEdit((prev) => ({ ...prev, error: "Selecciona la procedencia del alumno." }));
      return;
    }
    if (academicEdit.previousSchoolType === "OTHER" && !String(academicEdit.previousSchoolName || "").trim()) {
      setAcademicEdit((prev) => ({ ...prev, error: "Especifica el nombre del colegio de procedencia." }));
      return;
    }
    if (!academicEdit.campusCode || !academicEdit.level || !academicEdit.grade || !academicEdit.classroomId) {
      setAcademicEdit((prev) => ({ ...prev, error: "Completa campus, nivel, grado y salón." }));
      return;
    }

    const classroom = academicClassroomOptions.find((row) => (
      String(row.classroomId || row.id || row._id) === String(academicEdit.classroomId)
    ));

    updateStudent(academicEdit.localId, {
      previousSchoolType: academicEdit.previousSchoolType,
      previousSchoolName: academicEdit.previousSchoolType === "OTHER" ? academicEdit.previousSchoolName : "",
      campusCode: academicEdit.campusCode,
      level: academicEdit.level,
      grade: academicEdit.grade,
      classroomId: academicEdit.classroomId,
      classroomLabel: classroom?.label || classroom?.displayName || "",
    });
    closeAcademicEdit();
  }

  async function addManualTutor() {
    setManualTutorErrors({});

    if (!manualTutor.names.trim() || !manualTutor.lastNames.trim()) {
      setStatusMessage("Completa nombres y apellidos del tutor.");
      return;
    }
    if (!studentsDraft.length) {
      setStatusMessage("Primero agrega al menos un alumno.");
      return;
    }

    const normalizedDni = normalizeStudentDni(manualTutor.dni);
    if (manualTutor.dni && !isValidDni(manualTutor.dni)) {
      setStatusMessage("El DNI del tutor debe tener 8 dígitos numéricos.");
      setToast({ type: "error", message: "El DNI del tutor debe tener exactamente 8 números." });
      setManualTutorErrors({ dni: "El DNI debe tener exactamente 8 números." });
      manualTutorDniRef.current?.focus();
      return;
    }

    const draftDniError = validateDraftTutorDni("", normalizedDni);
    if (draftDniError) {
      setStatusMessage(draftDniError);
      setToast({ type: "error", message: draftDniError });
      setManualTutorErrors({ dni: draftDniError });
      manualTutorDniRef.current?.focus();
      return;
    }

    if (normalizedDni && relatedTutorDniSet.has(normalizedDni)) {
      setStatusMessage("Ya existe un tutor relacionado con ese DNI en los alumnos seleccionados.");
      setToast({ type: "error", message: "El DNI del tutor ya está relacionado con un alumno de esta matrícula." });
      setManualTutorErrors({ dni: "Este DNI ya pertenece a un tutor relacionado con los alumnos seleccionados." });
      manualTutorDniRef.current?.focus();
      return;
    }

    if (normalizedDni) {
      try {
        const [tutorResponse, studentResponse] = await Promise.all([
          searchTutorsForEnrollments({ q: normalizedDni, limit: 5 }),
          searchStudents({ q: normalizedDni, limit: 5 }),
        ]);

        const tutorItems = Array.isArray(tutorResponse?.items) ? tutorResponse.items : [];
        const studentItems = Array.isArray(studentResponse?.items) ? studentResponse.items : [];

        const duplicatedTutorInDb = tutorItems.some((tutor) => normalizeStudentDni(tutor.dni) === normalizedDni);
        if (duplicatedTutorInDb) {
          setStatusMessage("Ya existe un tutor registrado con ese DNI.");
          setToast({ type: "error", message: "El DNI del tutor ya se encuentra registrado en la base de datos." });
          setManualTutorErrors({ dni: "Este DNI ya está registrado en la base de datos." });
          manualTutorDniRef.current?.focus();
          return;
        }

        const duplicatedStudentInDb = studentItems.some((student) => normalizeStudentDni(student.dni || student.personId?.dni) === normalizedDni);
        if (duplicatedStudentInDb) {
          setStatusMessage("Ese DNI ya pertenece a un alumno registrado.");
          setToast({ type: "error", message: "El DNI ingresado ya pertenece a un alumno y no puede usarse como tutor." });
          setManualTutorErrors({ dni: "Este DNI ya pertenece a un alumno registrado." });
          manualTutorDniRef.current?.focus();
          return;
        }
      } catch (error) {
        if (!isRemoteValidationRecoverable(error)) {
          setStatusMessage(getErrorMessage(error, "No se pudo validar el DNI del tutor."));
          setToast({ type: "error", message: "No se pudo validar el DNI del tutor." });
          return;
        }
        setStatusMessage("No se pudo validar el DNI del tutor contra base en este momento. Se aplicará validación local.");
      }
    }

    setTutorsDraft((prev) => [...prev, {
      ...manualTutor,
      linkedStudentIds: studentsDraft.map((student) => student.localId),
    }]);
    setManualTutor(emptyTutorDraft());
    setManualTutorErrors({});
    setStatusMessage("");
  }

  function addExistingTutor(tutor) {
    if (!studentsDraft.length) {
      setStatusMessage("Primero agrega al menos un alumno.");
      return;
    }

    const normalizedDni = normalizeStudentDni(tutor.dni);
    if (normalizedDni && studentsDraft.some((student) => normalizeStudentDni(student.dni) === normalizedDni)) {
      setStatusMessage("Ese DNI ya fue usado por un alumno en esta matrícula.");
      setToast({ type: "error", message: "El DNI ingresado ya pertenece a un alumno de esta matrícula." });
      return;
    }

    const draftTutor = {
      localId: `existing-tutor-${tutor.personId || tutor.id}`,
      mode: "existing",
      existingTutorId: tutor.personId || tutor.id || "",
      relationship: tutor.relationshipHints?.[0] || "Apoderado",
      names: tutor.names || "",
      lastNames: tutor.lastNames || "",
      dni: tutor.dni || "",
      phone: tutor.phone || "",
      isLegalResponsible: true,
      includeInContract: true,
      linkedStudentIds: studentsDraft.map((student) => student.localId),
      source: "existing-search",
    };

    const identity = tutorIdentityKey(draftTutor);
    if (tutorsDraft.some((item) => tutorIdentityKey(item) === identity)) {
      setStatusMessage("Ese tutor ya esta agregado en el draft.");
      return;
    }

    setTutorsDraft((prev) => [...prev, draftTutor]);
    setTutorSearch("");
    setTutorResults([]);
    setStatusMessage("");
  }

  function openTutorEdit(tutor) {
    setTutorEdit({
      open: true,
      localId: tutor.localId,
      names: tutor.names || "",
      lastNames: tutor.lastNames || "",
      dni: tutor.dni || "",
      phone: tutor.phone || "",
      relationship: tutor.relationship || "Apoderado",
      error: "",
    });
  }

  function closeTutorEdit() {
    setTutorEdit({
      open: false,
      localId: "",
      names: "",
      lastNames: "",
      dni: "",
      phone: "",
      relationship: "Apoderado",
      error: "",
    });
  }

  async function saveTutorEdit() {
    const names = String(tutorEdit.names || "").trim();
    const lastNames = String(tutorEdit.lastNames || "").trim();
    const dni = sanitizeDniInput(tutorEdit.dni);
    const currentTutor = tutorsDraft.find((tutor) => tutor.localId === tutorEdit.localId);

    if (!names || !lastNames) {
      setTutorEdit((prev) => ({ ...prev, error: "Completa nombres y apellidos del tutor." }));
      return;
    }

    if (dni && !isValidDni(dni)) {
      setTutorEdit((prev) => ({ ...prev, error: "El DNI debe tener exactamente 8 números." }));
      return;
    }

    const dniError = validateDraftTutorDni(tutorEdit.localId, dni);
    if (dniError) {
      setTutorEdit((prev) => ({ ...prev, error: dniError }));
      return;
    }

    if (dni) {
      try {
        const [tutorResponse, studentResponse] = await Promise.all([
          searchTutorsForEnrollments({ q: dni, limit: 5 }),
          searchStudents({ q: dni, limit: 5 }),
        ]);

        const tutorItems = Array.isArray(tutorResponse?.items) ? tutorResponse.items : [];
        const studentItems = Array.isArray(studentResponse?.items) ? studentResponse.items : [];

        const duplicatedTutorInDb = tutorItems.some((tutor) => {
          const sameDni = normalizeStudentDni(tutor.dni) === dni;
          if (!sameDni) return false;
          if (currentTutor?.existingTutorId) {
            return String(tutor.personId || tutor.id) !== String(currentTutor.existingTutorId);
          }
          return true;
        });

        if (duplicatedTutorInDb) {
          setTutorEdit((prev) => ({ ...prev, error: "Ese DNI ya pertenece a otro tutor registrado." }));
          return;
        }

        const duplicatedStudentInDb = studentItems.some((student) => normalizeStudentDni(student.dni || student.personId?.dni) === dni);
        if (duplicatedStudentInDb) {
          setTutorEdit((prev) => ({ ...prev, error: "Ese DNI ya pertenece a un alumno registrado." }));
          return;
        }
      } catch (error) {
        if (!isRemoteValidationRecoverable(error)) {
          setTutorEdit((prev) => ({ ...prev, error: getErrorMessage(error, "No se pudo validar el DNI del tutor.") }));
          return;
        }
        setStatusMessage("No se pudo validar el DNI del tutor contra base en este momento. Se aplicará validación local.");
      }
    }

    updateTutor(tutorEdit.localId, {
      names,
      lastNames,
      dni,
      phone: String(tutorEdit.phone || "").trim(),
      relationship: tutorEdit.relationship || "Apoderado",
    });
    closeTutorEdit();
  }

  function updateTutor(localId, patch) {
    setTutorsDraft((prev) => prev.map((tutor) => (
      tutor.localId === localId ? { ...tutor, ...patch } : tutor
    )));
  }

  function removeTutor(localId) {
    setTutorsDraft((prev) => prev.filter((tutor) => tutor.localId !== localId));
  }

  function resetDraft() {
    setCurrentStep(1);
    setStudentsDraft([]);
    setTutorsDraft([]);
    setStudentSearch("");
    setStudentResults([]);
    setTutorSearch("");
    setTutorResults([]);
    setManualStudent(emptyStudentDraft(activeCampus || ""));
    setManualTutor(emptyTutorDraft());
    setManualStudentErrors({});
    setManualTutorErrors({});
    setObservations({ general: "", address: "" });
    setStatusMessage("");
  }

  function handleCancelDraft() {
    setIsCancelModalOpen(true);
  }

  function closeCancelModal() {
    setIsCancelModalOpen(false);
  }

  function confirmCancelDraft() {
    setIsCancelModalOpen(false);
    resetDraft();
    navigate(ROUTES.dashboardEnrollments);
  }

  function openContractPreview(contractPayload) {
    const contractKey = `enrollment-contract-preview-v2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(contractKey, JSON.stringify(contractPayload));
    window.open(`${ROUTES.dashboardEnrollmentContractPreview}?contractKey=${encodeURIComponent(contractKey)}`, "_blank", "noopener,noreferrer");
    return contractKey;
  }

  function handlePreviewContract() {
    if (!canPreview) {
      setStatusMessage("Agrega alumnos, marca al menos un tutor firmante y completa la dirección de contacto antes de ver el contrato.");
      return;
    }

    const contractPayload = buildContractPayload({
      activeCampus,
      students: studentsDraft,
      tutors: tutorsDraft,
      observations,
    });
    openContractPreview(contractPayload);
  }

  async function handleSubmit() {
    if (!canSubmit) {
      setStatusMessage("Completa alumnos, salones, al menos un tutor firmante y la dirección de contacto antes de matricular.");
      return;
    }

    const allStudentIds = studentsDraft.map((student) => student.localId);
    const contractPayload = buildContractPayload({
      activeCampus,
      students: studentsDraft,
      tutors: tutorsDraft,
      observations,
    });

    const payload = {
      activeCycleId: activeCycle?.id || activeCycle?._id || "",
      students: studentsDraft.map((student) => ({
        ...student,
        existingStudentId: compactOptionalId(student.existingStudentId),
      })),
      tutors: tutorsDraft.map((tutor) => ({
        ...tutor,
        existingTutorId: compactOptionalId(tutor.existingTutorId),
        linkedStudentIds: allStudentIds,
      })),
      observations,
    };

    console.log("[MatriculasV2][Finalize][PAYLOAD]", payload);

    const response = await finalizeMutation.mutateAsync(payload);
    const contractKey = `enrollment-contract-preview-v2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(contractKey, JSON.stringify(contractPayload));

    setCompletedEnrollment({
      enrollmentId: response?.enrollmentId || "",
      enrollmentIds: Array.isArray(response?.enrollmentIds) ? response.enrollmentIds : [],
      status: response?.status || "ENROLLED",
      studentCount: studentsDraft.length,
      tutorCount: tutorsDraft.filter((tutor) => tutor.includeInContract).length,
      students: studentsDraft.map((student) => ({
        fullName: formatDraftStudentName(student),
        classroomLabel: student.classroomLabel || "",
        campusCode: student.campusCode || "",
      })),
      contactAddress: observations.address || "",
      contractKey,
      contractPayload,
    });
    setStatusMessage("Matrícula registrada correctamente.");
  }

  function handleNextStep() {
    if (currentStep === 1 && !canContinueFromStudents) {
      setStepOneFlashIds(incompleteStepOneStudentIds);
      window.setTimeout(() => setStepOneFlashIds([]), 1200);
      setStatusMessage("Antes de continuar, agrega alumnos válidos y completa campus, nivel, grado y salón.");
      return;
    }

    if (currentStep === 2 && !canContinueFromTutors) {
      setStatusMessage("Antes de continuar, agrega al menos un tutor y marca al menos uno para incluirlo en el contrato.");
      return;
    }

    setStatusMessage("");
    setCurrentStep((prev) => Math.min(4, prev + 1));
  }

  function handlePreviousStep() {
    setStatusMessage("");
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }

  function handlePreviewCompletedContract() {
    if (!completedEnrollment?.contractPayload) return;
    openContractPreview(completedEnrollment.contractPayload);
  }

  function handleStartNewEnrollment() {
    setCompletedEnrollment(null);
    resetDraft();
  }

  return (
    <div className="space-y-5">
      {isResumeMode && resumeEnrollmentQuery.isLoading ? (
        <Card className="border border-blue-200 bg-blue-50 text-sm text-blue-800">
          Cargando matrícula ausente para continuar el flujo...
        </Card>
      ) : null}

      {isResumeMode && resumeEnrollmentQuery.isError ? (
        <Card className="border border-red-200 bg-red-50 text-sm text-red-700">
          {getErrorMessage(resumeEnrollmentQuery.error, "No se pudo cargar la matrícula a reanudar.")}
        </Card>
      ) : null}

      <BaseModal
        open={isCancelModalOpen}
        onClose={closeCancelModal}
        title="Cancelar matrícula"
        maxWidthClass="max-w-md"
        footer={(
          <div className="flex justify-end gap-2">
            <Button onClick={closeCancelModal}>Seguir editando</Button>
            <SecondaryButton onClick={confirmCancelDraft}>Sí, cancelar</SecondaryButton>
          </div>
        )}
      >
        <div className="space-y-3 p-5 text-sm text-slate-700">
          <p>Se perderán los datos ingresados en esta matrícula que todavía no han sido confirmados.</p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
            Esta acción limpiará el borrador actual y te devolverá al inicio del flujo.
          </p>
        </div>
      </BaseModal>

      <BaseModal
        open={personalEdit.open}
        onClose={closePersonalEdit}
        title="Editar datos del alumno"
        maxWidthClass="max-w-2xl"
        footer={(
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={closePersonalEdit}>Cancelar</SecondaryButton>
            <Button onClick={savePersonalEdit}>Guardar cambios</Button>
          </div>
        )}
      >
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Input
            label="Nombres"
            value={personalEdit.names}
            onChange={(event) => {
              setPersonalEdit((prev) => ({ ...prev, names: event.target.value, error: "" }));
              setStatusMessage("");
              setToast(null);
            }}
          />
          <Input
            label="Apellidos"
            value={personalEdit.lastNames}
            onChange={(event) => {
              setPersonalEdit((prev) => ({ ...prev, lastNames: event.target.value, error: "" }));
              setStatusMessage("");
              setToast(null);
            }}
          />
          <div className="md:col-span-2">
            <Input
              label="DNI"
              value={personalEdit.dni}
              onChange={(event) => {
                setPersonalEdit((prev) => ({ ...prev, dni: sanitizeDniInput(event.target.value), error: "" }));
                setStatusMessage("");
                setToast(null);
              }}
              inputMode="numeric"
              maxLength={8}
              placeholder="8 dígitos"
            />
            <p className={`mt-1 text-xs ${personalEdit.error ? "text-red-600" : "text-slate-500"}`}>
              {personalEdit.error || "Solo se admiten 8 números. Puedes corregir el DNI antes de guardar."}
            </p>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        open={academicEdit.open}
        onClose={closeAcademicEdit}
        title="Configurar ubicación académica"
        maxWidthClass="max-w-3xl"
        footer={(
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={closeAcademicEdit}>Cancelar</SecondaryButton>
            <Button onClick={saveAcademicEdit}>Guardar cambios</Button>
          </div>
        )}
      >
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Procedencia</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={academicEdit.previousSchoolType}
              onChange={(event) => setAcademicEdit((prev) => ({
                ...prev,
                previousSchoolType: event.target.value,
                previousSchoolName: event.target.value === "OTHER" ? prev.previousSchoolName : "",
                error: "",
              }))}
            >
              {PREVIOUS_SCHOOL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {academicEdit.previousSchoolType === "OTHER" ? (
            <Input
              label="Nombre del colegio de procedencia"
              value={academicEdit.previousSchoolName}
              onChange={(event) => setAcademicEdit((prev) => ({ ...prev, previousSchoolName: event.target.value, error: "" }))}
              placeholder="Especifica el nombre del colegio"
            />
          ) : <div />}

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Campus</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={academicEdit.campusCode}
              onChange={(event) => setAcademicEdit((prev) => ({
                ...prev,
                campusCode: event.target.value,
                classroomId: "",
                error: "",
              }))}
            >
              <option value="">Selecciona</option>
              {campuses.map((campus) => (
                <option key={campus.id || campus.code} value={campus.code}>{campus.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Nivel</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={academicEdit.level}
              onChange={(event) => setAcademicEdit((prev) => ({
                ...prev,
                level: event.target.value,
                grade: "",
                classroomId: "",
                error: "",
              }))}
            >
              <option value="">Selecciona</option>
              {LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Grado</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={academicEdit.grade}
              onChange={(event) => setAcademicEdit((prev) => ({
                ...prev,
                grade: event.target.value,
                classroomId: "",
                error: "",
              }))}
            >
              <option value="">Selecciona</option>
              {GRADE_OPTIONS
                .filter((grade) => !(academicEdit.level === "INITIAL" && Number(grade) > 3))
                .map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
            </select>
          </div>

          <div className="flex flex-col space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Salón</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={academicEdit.classroomId}
              onChange={(event) => setAcademicEdit((prev) => ({ ...prev, classroomId: event.target.value, error: "" }))}
            >
              <option value="">Selecciona</option>
              {academicClassroomOptions.map((option) => {
                const classroomId = option.classroomId || option.id || option._id;
                const available = Number(option.availableCount ?? option.available ?? 0);
                const isFull = available <= 0 && String(classroomId) !== String(academicEdit.classroomId);
                return (
                  <option key={classroomId} value={classroomId} disabled={isFull}>
                    {(option.label || option.displayName || option.name || "Aula")} {isFull ? "· Sin vacantes" : `· ${available} vacantes`}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="md:col-span-2">
            <p className={`text-xs ${academicEdit.error ? "text-red-600" : "text-slate-500"}`}>
              {academicEdit.error || "Configura campus, nivel, grado y salón del alumno antes de continuar."}
            </p>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        open={tutorEdit.open}
        onClose={closeTutorEdit}
        title="Editar tutor"
        maxWidthClass="max-w-2xl"
        footer={(
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={closeTutorEdit}>Cancelar</SecondaryButton>
            <Button onClick={saveTutorEdit}>Guardar cambios</Button>
          </div>
        )}
      >
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Input
            label="Nombres"
            value={tutorEdit.names}
            onChange={(event) => {
              setTutorEdit((prev) => ({ ...prev, names: event.target.value, error: "" }));
              setStatusMessage("");
              setToast(null);
            }}
          />
          <Input
            label="Apellidos"
            value={tutorEdit.lastNames}
            onChange={(event) => {
              setTutorEdit((prev) => ({ ...prev, lastNames: event.target.value, error: "" }));
              setStatusMessage("");
              setToast(null);
            }}
          />
          <div className="md:col-span-2">
            <Input
              label="DNI"
              value={tutorEdit.dni}
              onChange={(event) => {
                setTutorEdit((prev) => ({ ...prev, dni: sanitizeDniInput(event.target.value), error: "" }));
                setStatusMessage("");
                setToast(null);
              }}
              inputMode="numeric"
              maxLength={8}
              placeholder="8 dígitos"
            />
          </div>
          <Input
            label="Teléfono"
            value={tutorEdit.phone}
            onChange={(event) => {
              setTutorEdit((prev) => ({ ...prev, phone: event.target.value, error: "" }));
              setStatusMessage("");
              setToast(null);
            }}
          />
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Parentesco</label>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={tutorEdit.relationship}
              onChange={(event) => {
                setTutorEdit((prev) => ({ ...prev, relationship: event.target.value, error: "" }));
                setStatusMessage("");
                setToast(null);
              }}
            >
              <option value="Padre">Padre</option>
              <option value="Madre">Madre</option>
              <option value="Apoderado">Apoderado</option>
              <option value="Tutor">Tutor</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <p className={`text-xs ${tutorEdit.error ? "text-red-600" : "text-slate-500"}`}>
              {tutorEdit.error || "Puedes actualizar DNI, teléfono y parentesco antes de guardar."}
            </p>
          </div>
        </div>
      </BaseModal>

      {toast ? (
        <div className={`rounded-md border px-3 py-2 text-sm ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {toast.message}
        </div>
      ) : null}

      {completedEnrollment ? (
        <>
          <Card className="border border-emerald-200 bg-emerald-50 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Matrícula completada</p>
                <h2 className="mt-1 text-xl font-semibold text-emerald-950">La matrícula fue registrada correctamente</h2>
                <p className="mt-2 text-sm text-emerald-800">
                  Esta es la parte final del proceso. Desde aquí solo puedes revisar el resultado y abrir el contrato.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm text-slate-700">
                <p><span className="font-semibold text-slate-900">Estado:</span> {completedEnrollment.status}</p>
                <p><span className="font-semibold text-slate-900">Alumnos:</span> {completedEnrollment.studentCount}</p>
                <p><span className="font-semibold text-slate-900">Tutores firmantes:</span> {completedEnrollment.tutorCount}</p>
                {completedEnrollment.enrollmentId ? (
                  <p><span className="font-semibold text-slate-900">Matrícula:</span> {completedEnrollment.enrollmentId}</p>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="text-sm font-semibold text-slate-900">Alumnos matriculados</p>
                <div className="mt-3 space-y-3">
                  {completedEnrollment.students.map((student, index) => (
                    <div key={`completed-student-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-sm font-semibold text-slate-900">{student.fullName}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {student.campusCode ? `Campus: ${student.campusCode}` : "Campus pendiente"} · {student.classroomLabel || "Salón pendiente"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Resumen final</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p><span className="font-medium text-slate-900">Dirección de contacto:</span> {completedEnrollment.contactAddress || "-"}</p>
                  <p><span className="font-medium text-slate-900">Contrato:</span> disponible para revisión e impresión</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SecondaryButton onClick={handlePreviewCompletedContract}>Ver contrato</SecondaryButton>
                  <Button onClick={handleStartNewEnrollment}>Nueva matrícula</Button>
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : null}

      {!completedEnrollment ? (
        <>
      <Card className="border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="hidden md:grid md:grid-cols-4 md:gap-4">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isDone = currentStep > step.id;
              const isLast = index === steps.length - 1;

              return (
                <div key={step.id} className="relative">
                  {!isLast ? (
                    <div className="absolute left-[calc(50%+1.25rem)] right-[-50%] top-5 h-px bg-slate-200">
                      <div
                        className={`h-full transition-all ${isDone ? "bg-slate-900" : "bg-transparent"}`}
                      />
                    </div>
                  ) : null}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : isDone
                            ? "border-slate-900 bg-white text-slate-900"
                            : "border-slate-300 bg-white text-slate-400"
                      }`}
                    >
                      {isDone ? "✓" : step.id}
                    </div>
                    <div className="min-w-0 pt-1">
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isActive || isDone ? "text-slate-900" : "text-slate-400"}`}>
                        Paso {step.id}
                      </p>
                      <p className={`mt-1 text-sm font-medium ${isActive ? "text-slate-900" : isDone ? "text-slate-700" : "text-slate-500"}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="md:hidden">
            <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <span>Paso {currentStep}</span>
              <span>{steps.length} pasos</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-all"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {steps.find((step) => step.id === currentStep)?.label || ""}
            </p>
          </div>
        </div>
      </Card>

      {currentStep === 1 ? <Card className="border border-slate-200 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paso 1</p>
          <h2 className="text-lg font-semibold text-slate-900">Elegir o crear alumnos</h2>
          <p className="mt-1 text-sm text-slate-600">Cada alumno debe quedar con campus, nivel, grado y salón antes de matricular.</p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Alumnos en matrícula</p>
                <p className="text-xs text-slate-500">Completa sus datos académicos y valida vacantes.</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-900">{studentsDraft.length}</p>
                <p className="text-xs text-slate-500">registrados</p>
              </div>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {studentsDraft.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                  <p className="text-sm font-medium text-slate-700">Todavía no hay alumnos agregados.</p>
                  <p className="mt-1 text-xs text-slate-500">Busca un alumno existente o crea uno nuevo desde el panel derecho.</p>
                </div>
              ) : null}

              {studentsDraft.map((student) => {
                const classroomOptions = classroomOptionsByStudent.get(student.localId) || [];
                const ready = isStudentReady(student);
                const flashing = stepOneFlashIds.includes(student.localId);

                return (
                  <div
                    key={student.localId}
                    className={`rounded-2xl border p-4 transition-all ${
                      flashing
                        ? "animate-pulse border-red-500 bg-red-100 ring-2 ring-red-300"
                        : ready
                          ? "border-emerald-500 bg-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]"
                          : "border-slate-300 bg-slate-200"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {student.fullName || `${student.lastNames}, ${student.names}`}
                          </p>
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                              ready
                                ? "bg-emerald-600 text-white"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {ready ? "Completo" : "Pendiente"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {student.mode === "existing" ? "Alumno existente" : "Alumno nuevo"} · DNI: {student.dni || "-"}
                        </p>
                        {student.isBlocked ? (
                          <p className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                            {student.blockReason}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {student.mode === "existing" ? (
                          <>
                            <SecondaryButton onClick={() => openPersonalEdit(student)}>Datos</SecondaryButton>
                            <SecondaryButton onClick={() => openAcademicEdit(student)}>Ubicación</SecondaryButton>
                          </>
                        ) : null}
                        <SecondaryButton onClick={() => removeStudent(student.localId)}>Quitar</SecondaryButton>
                      </div>
                    </div>

                    {student.mode === "existing" ? (
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Datos personales</p>
                          <div className="mt-3 space-y-2 text-sm text-slate-700">
                            <p><span className="font-medium text-slate-900">Nombres:</span> {student.names || "-"}</p>
                            <p><span className="font-medium text-slate-900">Apellidos:</span> {student.lastNames || "-"}</p>
                            <p>
                              <span className="font-medium text-slate-900">DNI:</span>{" "}
                              {student.dni ? student.dni : <span className="font-semibold text-red-600">Pendiente</span>}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ubicación académica</p>
                          <div className="mt-3 space-y-2 text-sm text-slate-700">
                            <p><span className="font-medium text-slate-900">Procedencia:</span> {student.previousSchoolType === "OTHER" ? (student.previousSchoolName || "Otro colegio") : (student.previousSchoolType || "-")}</p>
                            <p>
                              <span className="font-medium text-slate-900">Campus:</span>{" "}
                              {student.campusCode ? student.campusCode : <span className="font-semibold text-red-600">Pendiente</span>}
                            </p>
                            <p>
                              <span className="font-medium text-slate-900">Nivel:</span>{" "}
                              {LEVEL_OPTIONS.find((option) => option.value === student.level)?.label || <span className="font-semibold text-red-600">Pendiente</span>}
                            </p>
                            <p>
                              <span className="font-medium text-slate-900">Grado:</span>{" "}
                              {student.grade ? student.grade : <span className="font-semibold text-red-600">Pendiente</span>}
                            </p>
                            <p>
                              <span className="font-medium text-slate-900">Salón:</span>{" "}
                              {student.classroomLabel ? student.classroomLabel : <span className="font-semibold text-red-600">Pendiente</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="flex flex-col space-y-1">
                          <label className="text-sm font-medium text-gray-700">Procedencia</label>
                          <select
                            className="rounded border px-3 py-2 text-sm"
                            value={student.previousSchoolType}
                            onChange={(event) => updateStudent(student.localId, { previousSchoolType: event.target.value })}
                          >
                            {PREVIOUS_SCHOOL_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        {student.previousSchoolType === "OTHER" ? (
                          <div className="flex flex-col space-y-1 md:col-span-2 xl:col-span-5">
                            <label className="text-sm font-medium text-gray-700">Nombre del colegio de procedencia</label>
                            <Input
                              value={student.previousSchoolName}
                              onChange={(event) => updateStudent(student.localId, { previousSchoolName: event.target.value })}
                              placeholder="Especifica el nombre del colegio"
                            />
                          </div>
                        ) : null}
                        <div className="flex flex-col space-y-1">
                          <label className="text-sm font-medium text-gray-700">Campus</label>
                          <select className="rounded border px-3 py-2 text-sm" value={student.campusCode} onChange={(event) => updateStudent(student.localId, { campusCode: event.target.value, classroomId: "", classroomLabel: "" })}>
                            <option value="">Selecciona</option>
                            {campuses.map((campus) => (
                              <option key={campus.id || campus.code} value={campus.code}>{campus.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-sm font-medium text-gray-700">Nivel</label>
                          <select className="rounded border px-3 py-2 text-sm" value={student.level} onChange={(event) => updateStudent(student.localId, { level: event.target.value, classroomId: "", classroomLabel: "" })}>
                            <option value="">Selecciona</option>
                            {LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-sm font-medium text-gray-700">Grado</label>
                          <select className="rounded border px-3 py-2 text-sm" value={student.grade} onChange={(event) => updateStudent(student.localId, { grade: event.target.value, classroomId: "", classroomLabel: "" })}>
                            <option value="">Selecciona</option>
                            {GRADE_OPTIONS.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col space-y-1 xl:col-span-2">
                          <label className="text-sm font-medium text-gray-700">Salón</label>
                          <select className="rounded border px-3 py-2 text-sm" value={student.classroomId} onChange={(event) => updateStudent(student.localId, { classroomId: event.target.value })}>
                            <option value="">Selecciona</option>
                            {classroomOptions.map((option) => {
                              const classroomId = option.classroomId || option.id || option._id;
                              const available = Number(option.availableCount ?? option.available ?? 0);
                              const isFull = available <= 0;
                              return (
                                <option key={classroomId} value={classroomId} disabled={isFull}>
                                  {(option.label || option.displayName || option.name || "Aula")} {isFull ? "· Sin vacantes" : `· ${available} vacantes`}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Buscar alumno existente</h3>
              <Input
                className="mt-3"
                label="Buscar por nombre, DNI o código"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Ej. 12345678 o Perez"
              />
              <div className="mt-3 max-h-[34vh] space-y-2 overflow-y-auto pr-1">
                {isSearchingStudents ? <p className="text-sm text-slate-500">Buscando alumnos...</p> : null}
                {!isSearchingStudents && studentSearch.trim().length >= 2 && studentResults.length === 0 ? (
                  <p className="text-sm text-slate-500">No se encontraron alumnos.</p>
                ) : null}
                {studentResults.map((student) => {
                  const isEnrolled = isExistingStudentAlreadyEnrolled(student);
                  return (
                    <div key={student.id || student._id} className="rounded-xl border border-slate-200 px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{formatStudentLabel(student) || "Alumno sin nombre"}</p>
                          <p className="text-xs text-slate-500">DNI: {student.dni || "-"} · Estado: {student.enrollmentStatus || "Sin dato"}</p>
                        </div>
                        <Button disabled={isEnrolled} size="sm" onClick={() => addExistingStudent(student)}>
                          {isEnrolled ? "Bloqueado" : "Agregar"}
                        </Button>
                      </div>
                      {isEnrolled ? (
                        <p className="mt-2 text-xs font-medium text-amber-700">Este alumno ya se matriculó.</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Crear alumno nuevo</h3>
              <div className="mt-3 grid gap-3">
                <Input label="Nombres" value={manualStudent.names} onChange={(event) => setManualStudent((prev) => ({ ...prev, names: event.target.value }))} />
                <Input label="Apellidos" value={manualStudent.lastNames} onChange={(event) => setManualStudent((prev) => ({ ...prev, lastNames: event.target.value }))} />
                <Input
                  ref={manualStudentDniRef}
                  label="DNI"
                  value={manualStudent.dni}
                  onChange={(event) => {
                    setManualStudent((prev) => ({ ...prev, dni: sanitizeDniInput(event.target.value) }));
                    setManualStudentErrors((prev) => ({ ...prev, dni: undefined }));
                  }}
                  inputMode="numeric"
                  maxLength={8}
                  className={manualStudentErrors.dni ? "[&>input]:border-red-300 [&>input]:bg-red-50 [&>input]:focus:ring-red-200" : ""}
                />
                {manualStudentErrors.dni ? <p className="-mt-2 text-xs text-red-600">{manualStudentErrors.dni}</p> : null}
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-gray-700">Genero</label>
                  <select className="rounded border px-3 py-2 text-sm" value={manualStudent.gender} onChange={(event) => setManualStudent((prev) => ({ ...prev, gender: event.target.value }))}>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={addManualStudent}>Agregar alumno</Button>
              </div>
            </div>
          </div>
        </div>
      </Card> : null}

      {currentStep === 2 ? <Card className="border border-slate-200 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paso 2</p>
          <h2 className="text-lg font-semibold text-slate-900">Elegir o crear tutores firmantes</h2>
          <p className="mt-1 text-sm text-slate-600">Deben mostrarse los tutores relacionados a alumnos existentes y permitir agregar nuevos firmantes para este contrato.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Tutores en el draft</h3>
            <div className="mt-3 space-y-3">
              {tutorsDraft.length === 0 ? <p className="text-sm text-slate-500">Todavia no hay tutores en el draft.</p> : null}
              {tutorsDraft.map((tutor) => (
                <div key={tutor.localId} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{[tutor.names, tutor.lastNames].filter(Boolean).join(" ") || "Tutor sin nombre"}</p>
                      <div className="mt-2 grid gap-1 text-xs text-slate-600 md:grid-cols-2">
                        <p>
                          <span className="font-medium text-slate-900">DNI:</span>{" "}
                          {tutor.dni ? tutor.dni : <span className="font-semibold text-red-600">Pendiente</span>}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Teléfono:</span>{" "}
                          {tutor.phone ? tutor.phone : <span className="font-semibold text-red-600">Pendiente</span>}
                        </p>
                        <p><span className="font-medium text-slate-900">Parentesco:</span> {tutor.relationship || "Apoderado"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <SecondaryButton onClick={() => openTutorEdit(tutor)}>Editar</SecondaryButton>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={tutor.includeInContract} onChange={(event) => updateTutor(tutor.localId, { includeInContract: event.target.checked })} />
                        Incluir en contrato
                      </label>
                      {tutor.source !== "student-summary" ? (
                        <SecondaryButton onClick={() => removeTutor(tutor.localId)}>Quitar</SecondaryButton>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="mt-3 rounded-xl border border-slate-200 p-3">
              <Input
                label="Buscar tutor"
                value={tutorSearch}
                onChange={(event) => setTutorSearch(event.target.value)}
                placeholder="Nombre, DNI o telefono"
              />
              <div className="mt-3 space-y-2">
                {isSearchingTutors ? <p className="text-sm text-slate-500">Buscando tutores...</p> : null}
                {!isSearchingTutors && tutorSearch.trim().length >= 2 && tutorResults.length === 0 ? (
                  <p className="text-sm text-slate-500">No se encontraron tutores existentes.</p>
                ) : null}
                {tutorResults.map((tutor) => {
                  const alreadyAdded = tutorsDraft.some((item) => tutorIdentityKey(item) === tutorIdentityKey({
                    existingTutorId: tutor.personId || tutor.id,
                    dni: tutor.dni,
                    names: tutor.names,
                    lastNames: tutor.lastNames,
                  }));
                  return (
                    <div key={tutor.id || tutor.personId} className="rounded-xl border border-slate-200 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tutor.fullName || [tutor.lastNames, tutor.names].filter(Boolean).join(", ")}</p>
                          <p className="text-xs text-slate-500">DNI: {tutor.dni || "-"} · Tel: {tutor.phone || "-"}</p>
                          {Array.isArray(tutor.linkedStudents) && tutor.linkedStudents.length ? (
                            <p className="mt-1 text-xs text-slate-500">
                              Ya relacionado con: {tutor.linkedStudents.map((row) => row.fullName || "Alumno").filter(Boolean).join(" | ")}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-slate-500">Tutor existente sin relaciones previas con alumnos.</p>
                          )}
                        </div>
                        <Button size="sm" disabled={alreadyAdded} onClick={() => addExistingTutor(tutor)}>
                          {alreadyAdded ? "Agregado" : "Agregar"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <Input label="Nombres" value={manualTutor.names} onChange={(event) => setManualTutor((prev) => ({ ...prev, names: event.target.value }))} />
              <Input label="Apellidos" value={manualTutor.lastNames} onChange={(event) => setManualTutor((prev) => ({ ...prev, lastNames: event.target.value }))} />
              <Input
                ref={manualTutorDniRef}
                label="DNI"
                value={manualTutor.dni}
                onChange={(event) => {
                  setManualTutor((prev) => ({ ...prev, dni: sanitizeDniInput(event.target.value) }));
                  setManualTutorErrors((prev) => ({ ...prev, dni: undefined }));
                }}
                inputMode="numeric"
                maxLength={8}
                className={manualTutorErrors.dni ? "[&>input]:border-red-300 [&>input]:bg-red-50 [&>input]:focus:ring-red-200" : ""}
              />
              {manualTutorErrors.dni ? <p className="-mt-2 text-xs text-red-600">{manualTutorErrors.dni}</p> : null}
              <Input label="Telefono" value={manualTutor.phone} onChange={(event) => setManualTutor((prev) => ({ ...prev, phone: event.target.value }))} />
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-700">Relacion</label>
                <select className="rounded border px-3 py-2 text-sm" value={manualTutor.relationship} onChange={(event) => setManualTutor((prev) => ({ ...prev, relationship: event.target.value }))}>
                  <option value="Padre">Padre</option>
                  <option value="Madre">Madre</option>
                  <option value="Apoderado">Apoderado</option>
                  <option value="Tutor">Tutor</option>
                </select>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">Alcance del tutor</p>
                <p className="mt-1 text-xs text-slate-500">
                  Todo tutor agregado en esta matrícula quedará como responsable de todos los alumnos del borrador.
                </p>
                {studentsDraft.length === 0 ? <p className="mt-3 text-xs text-slate-500">Primero agrega alumnos al draft.</p> : null}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={addManualTutor}>Agregar tutor</Button>
            </div>
          </div>
        </div>
      </Card> : null}

      {currentStep === 3 ? <Card className="border border-slate-200 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paso 3</p>
          <h2 className="text-lg font-semibold text-slate-900">Montos por alumno</h2>
        </div>
        <div className="space-y-3">
          {studentsDraft.map((student) => (
            <div key={`amount-${student.localId}`} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{student.fullName || `${student.lastNames}, ${student.names}`}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Procedencia: {student.previousSchoolType === "OTHER" ? (student.previousSchoolName || "Otro colegio") : student.previousSchoolType}
                  </p>
                </div>
                <SecondaryButton onClick={() => toggleDetailedPensions(student.localId, !student.amounts.useDetailedPensions)}>
                  {student.amounts.useDetailedPensions ? "Usar monto general" : "Especificar pensiones"}
                </SecondaryButton>
              </div>

              <div className={`mt-3 grid gap-3 ${student.previousSchoolType === "OTHER" ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
                {student.previousSchoolType === "OTHER" ? (
                  <>
                    <Input
                      label="Derecho de ingreso"
                      type="number"
                      value={student.amounts.admissionFeeAmount}
                      onChange={(event) => updateStudentAmount(student.localId, "admissionFeeAmount", event.target.value)}
                    />
                  </>
                ) : null}
                <Input label="Matricula" type="number" value={student.amounts.enrollmentFeeAmount} onChange={(event) => updateStudentAmount(student.localId, "enrollmentFeeAmount", event.target.value)} />
                <Input
                  label="Pension mensual"
                  type="number"
                  value={student.amounts.pensionAmount}
                  onChange={(event) => updateStudentAmount(student.localId, "pensionAmount", event.target.value)}
                  disabled={student.amounts.useDetailedPensions}
                />
              </div>

              {student.amounts.useDetailedPensions ? (
                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-900">Pensiones de marzo a diciembre</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {PENSION_MONTHS.map((month, index) => (
                      <Input
                        key={`${student.localId}-${month}`}
                        label={month}
                        type="number"
                        value={student.amounts.pensionMonthlyAmounts[index] ?? "0"}
                        onChange={(event) => {
                          const next = [...student.amounts.pensionMonthlyAmounts];
                          next[index] = event.target.value;
                          updateStudentAmount(student.localId, "pensionMonthlyAmounts", next);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card> : null}

      {currentStep === 4 ? <Card className="border border-slate-200 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paso 4</p>
          <h2 className="text-lg font-semibold text-slate-900">Observaciones</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Input
              label="Dirección de contacto"
              value={observations.address}
              onChange={(event) => setObservations((prev) => ({ ...prev, address: event.target.value }))}
              className={!hasContactAddress ? "[&>input]:border-red-300 [&>input]:bg-red-50 [&>input]:focus:ring-red-200" : ""}
            />
            <p className={`mt-1 text-xs ${hasContactAddress ? "text-slate-500" : "text-red-600"}`}>
              {hasContactAddress
                ? "Se usará como dirección de referencia para el contrato y comunicaciones."
                : "La dirección de contacto es obligatoria."}
            </p>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Observaciones generales</label>
            <textarea
              className="min-h-[120px] rounded border px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
              value={observations.general}
              onChange={(event) => setObservations((prev) => ({ ...prev, general: event.target.value }))}
              placeholder="Notas internas o comentarios del contrato"
            />
          </div>
        </div>
      </Card> : null}

      <Card className="border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-600">
            <p><span className="font-semibold text-slate-900">Resumen:</span> {studentsDraft.length} alumno(s) · {enabledTutorCount} tutor(es) firmante(s)</p>
            <p className="mt-1">Validaciones pendientes: {hasBlockedStudent ? "hay alumnos bloqueados" : "sin bloqueos"} · {hasStudentWithoutClassroom ? "faltan salones" : "salones completos"} · {enabledTutorCount > 0 ? "tutores listos para toda la matrícula" : "faltan tutores firmantes"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SecondaryButton onClick={handleCancelDraft}>Cancelar</SecondaryButton>
            {currentStep > 1 ? <SecondaryButton onClick={handlePreviousStep}>Atras</SecondaryButton> : null}
            {currentStep < 4 ? (
              <Button onClick={handleNextStep}>Siguiente</Button>
            ) : (
              <>
                <SecondaryButton onClick={handlePreviewContract}>Ver contrato</SecondaryButton>
                <Button onClick={handleSubmit} disabled={!canSubmit || finalizeMutation.isPending}>
                  {finalizeMutation.isPending ? "Matriculando..." : "Matricular"}
                </Button>
              </>
            )}
          </div>
        </div>
        {statusMessage ? <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">{statusMessage}</p> : null}
      </Card>
        </>
      ) : null}
    </div>
  );
}
