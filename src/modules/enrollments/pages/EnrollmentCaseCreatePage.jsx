import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { useCyclesQuery } from "../../admin/hooks/useCyclesQuery";
import { useCampusesQuery } from "../../admin/hooks/useCampusesQuery";
import { useClassroomsQuery } from "../../admin/hooks/useClassroomsQuery";
import { useFamiliesSearchQuery } from "../../families/hooks/useFamiliesSearchQuery";
import EnrollmentStudentCard from "../components/EnrollmentStudentCard";
import SearchOrCreateStudentModal from "../components/SearchOrCreateStudentModal";
import { useEnrollmentCaseDraftMutation } from "../hooks/useEnrollmentCaseDraftMutation";
import { useConfirmEnrollmentCaseMutation } from "../hooks/useConfirmEnrollmentCaseMutation";
import { useRemoveEnrollmentCaseStudentMutation } from "../hooks/useRemoveEnrollmentCaseStudentMutation";
import {
  buildPensionArrayFromGeneralAmount,
  normalizePensionArray,
  validateCase,
} from "../domain/enrollmentCaseValidation";

function roleCampus(role) {
  const value = String(role || "").toUpperCase();
  if (value.includes("CIENCIAS_APLICADAS") || value.includes("CIENCIAS_PRIM")) return "CIENCIAS_APLICADAS";
  if (value.includes("CIENCIAS")) return "CIENCIAS";
  if (value.includes("CIMAS")) return "CIMAS";
  return "";
}

function isPendingBackendError(error) {
  const status = error?.response?.status;
  return status === 404 || status === 501;
}

function emptyStudentAgreement(student) {
  return {
    localId: `${student?.id || student?._id}-${Date.now()}`,
    enrollmentStudentId: null,
    student,
    classroomId: "",
    previousSchoolType: "CIMAS",
    previousSchoolName: "",
    enrollmentFeeAmount: 0,
    enrollmentFeeExempt: false,
    admissionFeeAmount: 0,
    admissionFeeExempt: false,
    startMonthIndex: 0,
    pensionGeneral: 0,
    isPensionCustomized: false,
    pensionMonthlyAmounts: buildPensionArrayFromGeneralAmount(0, 0),
  };
}

export default function EnrollmentCaseCreatePage() {
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const [caseId, setCaseId] = useState(null);
  const [familyQuery, setFamilyQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [cycleId, setCycleId] = useState("");
  const [campusCode, setCampusCode] = useState(roleCampus(activeRole));
  const [students, setStudents] = useState([]);
  const [capacityByStudentId, setCapacityByStudentId] = useState({});
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const cyclesQuery = useCyclesQuery();
  const campusesQuery = useCampusesQuery();
  const classroomsQuery = useClassroomsQuery();
  const familiesQuery = useFamiliesSearchQuery({ q: familyQuery, enabled: true, limit: 10 });

  const draftMutation = useEnrollmentCaseDraftMutation();
  const confirmMutation = useConfirmEnrollmentCaseMutation();
  const removeStudentMutation = useRemoveEnrollmentCaseStudentMutation();

  const classrooms = useMemo(() => {
    const rows = Array.isArray(classroomsQuery.data?.items) ? classroomsQuery.data.items : Array.isArray(classroomsQuery.data) ? classroomsQuery.data : [];
    if (!campusCode) return rows;
    return rows.filter((row) => {
      const code = String(row?.campusCode || row?.campusAlias || "").toUpperCase();
      return !code || code === String(campusCode).toUpperCase();
    });
  }, [classroomsQuery.data, campusCode]);

  const familyRows = useMemo(() => (Array.isArray(familiesQuery.data?.items) ? familiesQuery.data.items : []), [familiesQuery.data]);

  const normalizedStudents = useMemo(
    () => students.map((item) => ({ ...item, pensionMonthlyAmounts: normalizePensionArray(item.pensionMonthlyAmounts, -1) })),
    [students],
  );

  const caseValidation = useMemo(() => validateCase({
    cycleId,
    campusCode,
    familyId: selectedFamily?.id || selectedFamily?._id,
    students: normalizedStudents,
  }, capacityByStudentId), [cycleId, campusCode, selectedFamily, normalizedStudents, capacityByStudentId]);

  const hasCapacityCheckBlock = useMemo(
    () => Object.values(capacityByStudentId).some((state) => state?.isError || state?.isLoading),
    [capacityByStudentId],
  );

  const computedCanConfirm = caseValidation.isValid && !hasCapacityCheckBlock && !confirmMutation.isPending;

  const payload = useMemo(() => ({
    cycleId,
    campusCode,
    familyId: selectedFamily?.id || selectedFamily?._id,
    enrollmentStudents: normalizedStudents.map((item) => ({
      id: item.enrollmentStudentId || undefined,
      studentId: item?.student?.id || item?.student?._id,
      classroomId: item.classroomId,
      previousSchoolType: item.previousSchoolType,
      previousSchoolName: item.previousSchoolType === "OTHER" ? item.previousSchoolName : undefined,
      enrollmentFee: { amount: Number(item.enrollmentFeeAmount || 0), isExempt: Boolean(item.enrollmentFeeExempt) },
      admissionFee: {
        applies: item.previousSchoolType === "OTHER",
        amount: item.previousSchoolType === "OTHER" ? Number(item.admissionFeeAmount || 0) : 0,
        isExempt: item.previousSchoolType === "OTHER" ? Boolean(item.admissionFeeExempt) : false,
      },
      startMonthIndex: Number(item.startMonthIndex || 0),
      pensionMonthlyAmounts: normalizePensionArray(item.pensionMonthlyAmounts, -1),
      notes: item.notes || "",
    })),
  }), [cycleId, campusCode, selectedFamily, normalizedStudents]);

  const saveDraft = async () => {
    setFeedback("");
    try {
      const data = await draftMutation.mutateAsync({ caseId, payload });
      const newCaseId = data?.id || data?.case?.id || caseId;
      if (newCaseId) setCaseId(newCaseId);
      setFeedback("Borrador guardado correctamente.");
    } catch (error) {
      if (isPendingBackendError(error)) {
        setFeedback("Borrador local: endpoint pendiente de backend (/api/enrollment-cases).");
        return;
      }
      setFeedback("No se pudo guardar borrador.");
    }
  };

  const confirmCase = async () => {
    setFeedback("");

    if (!computedCanConfirm) {
      setFeedback(caseValidation.blockingReason || "No se puede confirmar: revisa los datos del paquete.");
      return;
    }

    let activeCaseId = caseId;
    try {
      if (!activeCaseId) {
        const created = await draftMutation.mutateAsync({ caseId: null, payload });
        activeCaseId = created?.id || created?.case?.id;
        if (activeCaseId) setCaseId(activeCaseId);
      }

      if (!activeCaseId) {
        setFeedback("No se pudo obtener id del caso para confirmar.");
        return;
      }

      const result = await confirmMutation.mutateAsync({ caseId: activeCaseId, payload: {} });
      const summary = result?.summary;
      setFeedback(summary ? `Confirmado. Alumnos: ${summary.studentsConfirmedCount || 0} · Cargos: ${summary.chargesCreatedCount || 0}` : "Matrícula confirmada.");
      navigate(ROUTES.dashboardEnrollments);
    } catch (error) {
      if (isPendingBackendError(error)) {
        setFeedback("Confirmación pendiente de backend: implementar POST /api/enrollment-cases/:id/confirm.");
        return;
      }
      setFeedback("No se pudo confirmar la matrícula completa.");
    }
  };

  const handleRemoveStudent = async (studentDraft) => {
    const confirmed = window.confirm("¿Quitar alumno del paquete?");
    if (!confirmed) return;

    const localId = studentDraft?.localId;
    setStudents((prev) => prev.filter((row) => row.localId !== localId));
    setCapacityByStudentId((prev) => {
      const copy = { ...prev };
      delete copy[localId];
      return copy;
    });

    if (!caseId || !studentDraft?.enrollmentStudentId) {
      setFeedback("Alumno retirado del paquete local. No persistido en backend.");
      return;
    }

    try {
      await removeStudentMutation.mutateAsync({ caseId, enrollmentStudentId: studentDraft.enrollmentStudentId });
      setFeedback("Alumno retirado del paquete.");
    } catch (error) {
      if (isPendingBackendError(error)) {
        setFeedback("Alumno retirado localmente. Endpoint DELETE pendiente de backend.");
        return;
      }
      setFeedback("No se pudo persistir el retiro del alumno en backend.");
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <Card className="border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Nueva Matrícula</h1>
            <p className="text-sm text-gray-600">Flujo de matrícula completa por paquete familiar.</p>
          </div>
          <SecondaryButton onClick={() => navigate(ROUTES.dashboardEnrollments)}>Volver al tablero</SecondaryButton>
        </div>
      </Card>

      {hasCapacityCheckBlock ? (
        <Card className="border border-amber-200 bg-amber-50 text-sm text-amber-800">
          No se puede confirmar sin validar cupos. Revisa salones con cupo pendiente o error de consulta.
        </Card>
      ) : null}

      {feedback ? (
        <Card className={`text-sm ${feedback.toLowerCase().includes("no se pudo") ? "border border-red-200 bg-red-50 text-red-700" : "border border-gray-200 text-gray-700"}`}>
          {feedback}
        </Card>
      ) : null}

      <Card className="border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Contexto del caso</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ciclo</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={cycleId} onChange={(e) => setCycleId(e.target.value)}>
              <option value="">Seleccionar ciclo</option>
              {(Array.isArray(cyclesQuery.data?.items) ? cyclesQuery.data.items : cyclesQuery.data || []).map((cycle) => (
                <option key={cycle.id} value={cycle.id}>{cycle.name || cycle.label || cycle.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Campus</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={campusCode} onChange={(e) => setCampusCode(e.target.value)}>
              <option value="">Seleccionar campus</option>
              {(Array.isArray(campusesQuery.data?.items) ? campusesQuery.data.items : campusesQuery.data || []).map((campus) => (
                <option key={campus.id || campus.code} value={campus.code || campus.alias || campus.name}>{campus.name || campus.code || campus.alias}</option>
              ))}
            </select>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Estado del caso: <span className="font-semibold">DRAFT</span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <Input label="Buscar familia" value={familyQuery} onChange={(e) => setFamilyQuery(e.target.value)} placeholder="DNI, nombres o teléfono" />
          <div className="max-h-40 space-y-2 overflow-auto">
            {familyRows.map((family) => (
              <button key={family.id || family._id} type="button" onClick={() => setSelectedFamily(family)} className="w-full rounded-lg border border-gray-200 p-2 text-left text-sm hover:bg-gray-50">
                Family ID: {family.id || family._id} · Tutor: {family?.primaryTutor?.lastNames || family?.primaryTutor_send?.lastNames || "-"}
              </button>
            ))}
          </div>
          {selectedFamily ? <p className="text-xs text-emerald-700">Familia vinculada: {selectedFamily.id || selectedFamily._id}</p> : null}
        </div>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Alumnos del paquete</h2>
          <Button onClick={() => setStudentModalOpen(true)}>Agregar alumno</Button>
        </div>

        <div className="space-y-3">
          {students.map((item) => (
            <EnrollmentStudentCard
              key={item.localId}
              student={item.student}
              data={item}
              classrooms={classrooms}
              errors={caseValidation.errorsByStudentId[item.localId] || []}
              onCapacityStateChange={(studentLocalId, state) => {
                setCapacityByStudentId((prev) => ({ ...prev, [studentLocalId]: state }));
              }}
              onChange={(changes) => setStudents((prev) => prev.map((row) => (row.localId === item.localId ? { ...row, ...changes } : row)))}
              onRemove={() => handleRemoveStudent(item)}
              onOpenDetail={() => navigate(ROUTES.dashboardStudentDetail(item.student?.id || item.student?._id))}
            />
          ))}
          {!students.length ? <p className="text-sm text-gray-500">Aún no agregas alumnos al paquete. Debes agregar al menos uno para confirmar.</p> : null}
        </div>
      </Card>

      <Card className="sticky bottom-3 border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-600">
            {caseValidation.blockingReason || "Listo para guardar/confirmar."}
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={saveDraft} disabled={draftMutation.isPending}>Guardar borrador</SecondaryButton>
            <Button onClick={confirmCase} disabled={!computedCanConfirm}>Confirmar matrícula</Button>
          </div>
        </div>
      </Card>

      <SearchOrCreateStudentModal
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        onSelect={(student) => {
          const id = student?.id || student?._id;
          if (!id) return;
          setStudents((prev) => {
            if (prev.some((item) => (item.student?.id || item.student?._id) === id)) return prev;
            return [...prev, emptyStudentAgreement(student)];
          });
        }}
      />
    </div>
  );
}
