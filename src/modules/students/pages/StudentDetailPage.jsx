import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import { useAuth } from "../../../lib/auth";
import { ROUTES } from "../../../config/routes";
import { useStudentDetailQuery } from "../hooks/useStudentDetailQuery";
import { useClassroomCapacityQuery } from "../hooks/useClassroomCapacityQuery";
import { useConfirmEnrollmentMutation } from "../hooks/useConfirmEnrollmentMutation";
import { useUpdateStudentCycleStatusMutation } from "../hooks/useUpdateStudentCycleStatusMutation";
import { useChangeStudentClassroomMutation } from "../hooks/useChangeStudentClassroomMutation";
import { useCreateStudentChargeMutation } from "../hooks/useCreateStudentChargeMutation";
import { useUpdateStudentIdentityMutation } from "../hooks/useUpdateStudentIdentityMutation";
import { useUpdateStudentInternalNotesMutation } from "../hooks/useUpdateStudentInternalNotesMutation";
import { useClassroomsQuery } from "../../admin/hooks/useClassroomsQuery";
import { useBillingConceptsQuery } from "../../admin/hooks/useBillingConceptsQuery";
import RegisterPaymentModal from "../../payments/components/RegisterPaymentModal";
import { useStudentAccountStatementQuery } from "../../payments/hooks/useStudentAccountStatementQuery";
import IdentityEditModal from "../components/detail/IdentityEditModal";
import TutorsManageModal from "../components/detail/TutorsManageModal";
import AccountStatementModal from "../components/detail/AccountStatementModal";
import NotesEditModal from "../components/detail/NotesEditModal";
import { buildClassroomLookup, resolveClassroomId } from "../domain/classroomIdResolver";

function safeUpper(value) {
  return String(value || "").toUpperCase();
}

function getErrorMessage(error, fallback = "No se pudo completar la operación") {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return fallback;
}

function fullName(student = {}) {
  const lastNames = String(student.lastNames || "").trim();
  const names = String(student.names || "").trim();
  return [lastNames, names].filter(Boolean).join(" ") || "-";
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${amount.toFixed(2)}`;
}

function statusChipClass(status) {
  if (status === "ENROLLED") return "bg-emerald-100 text-emerald-800";
  if (status === "TRANSFERRED") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}


function StudentDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <div className="h-36 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-36 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

const initialEnrollmentForm = {
  monthlyFee: "",
  discountsDescription: "",
  observations: "",
};

const initialChargeForm = {
  billingConceptId: "",
  amount: "",
  dueDate: "",
  observation: "",
};

export default function StudentDetailPage() {
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const { studentId } = useParams();
  const [activeEditor, setActiveEditor] = useState(null);
  const [transferReason, setTransferReason] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [changeClassroomOpen, setChangeClassroomOpen] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [confirmEnrollmentOpen, setConfirmEnrollmentOpen] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState(initialEnrollmentForm);
  const [createChargeOpen, setCreateChargeOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState(initialChargeForm);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const detailQuery = useStudentDetailQuery(studentId);
  const detail = detailQuery.data || {};

  const student = detail.student || {};
  const familyLink = detail.familyLink || {};
  const enrollmentStatus = detail.enrollmentStatus || {};
  const debtsSummary = detail.debtsSummary || {};
  const enrollment = detail.enrollment || {};

  const status = safeUpper(enrollmentStatus.status || student.enrollmentStatus || "ABSENT");
  const internalNotes = detail.internalNotes || student.internalNotes || "";

  const classroomsQuery = useClassroomsQuery();
  const billingConceptsQuery = useBillingConceptsQuery();

  const confirmEnrollmentMutation = useConfirmEnrollmentMutation(studentId);
  const transferMutation = useUpdateStudentCycleStatusMutation(studentId);
  const changeClassroomMutation = useChangeStudentClassroomMutation(studentId);
  const createChargeMutation = useCreateStudentChargeMutation(studentId);
  const updateIdentityMutation = useUpdateStudentIdentityMutation(studentId);
  const updateNotesMutation = useUpdateStudentInternalNotesMutation(studentId);
  const accountStatementQuery = useStudentAccountStatementQuery(studentId, true);

  const classrooms = useMemo(() => {
    const rows = Array.isArray(classroomsQuery.data)
      ? classroomsQuery.data
      : Array.isArray(classroomsQuery.data?.items)
        ? classroomsQuery.data.items
        : [];

    const campusCode = String(student?.campusCode || "").toUpperCase();

    return rows.filter((classroom) => {
      if (!campusCode) return true;
      const rowCampus = String(classroom?.campusCode || classroom?.campusAlias || "").toUpperCase();
      return !rowCampus || rowCampus === campusCode;
    });
  }, [classroomsQuery.data, student?.campusCode]);

  const classroomLookup = useMemo(() => buildClassroomLookup(classrooms), [classrooms]);

  const resolvedSelectedClassroomId = useMemo(() => {
    if (!selectedClassroomId) return "";

    return (
      resolveClassroomId({
        value: selectedClassroomId,
        lookup: classroomLookup,
      }) || selectedClassroomId
    );
  }, [selectedClassroomId, classroomLookup]);

  const selectedClassroomCapacityQuery = useClassroomCapacityQuery(
    resolvedSelectedClassroomId,
    changeClassroomOpen && Boolean(resolvedSelectedClassroomId),
  );

  const selectedClassroomCapacity = useMemo(() => {
    const source = selectedClassroomCapacityQuery.data;
    const capacity = Number(source?.capacity ?? source?.total ?? source?.vacanciesTotal);
    const occupied = Number(source?.occupied ?? source?.enrolledCount ?? source?.enrolled);
    const available = Number(source?.available ?? source?.vacanciesAvailable ?? source?.remaining);

    if ([capacity, occupied, available].some((value) => Number.isNaN(value))) return null;

    return { capacity, occupied, available };
  }, [selectedClassroomCapacityQuery.data]);

  const canConfirmClassroomChange = useMemo(() => {
    if (!resolvedSelectedClassroomId) return false;
    if (!selectedClassroomCapacity) return false;

    const currentClassroomId = enrollmentStatus?.classroomId || enrollmentStatus?.classroom?.id || enrollment?.classroomId;
    if (String(currentClassroomId || "") === String(resolvedSelectedClassroomId)) return false;

    return selectedClassroomCapacity.available > 0;
  }, [resolvedSelectedClassroomId, selectedClassroomCapacity, enrollmentStatus, enrollment]);

  const tutors = useMemo(() => {
    const primaryTutor = familyLink?.primaryTutor_send
      ? { ...familyLink.primaryTutor_send, isPrimary: true }
      : null;
    const others = Array.isArray(familyLink?.otherTutors_send) ? familyLink.otherTutors_send : [];
    return [primaryTutor, ...others].filter(Boolean);
  }, [familyLink]);

  const billingConcepts = useMemo(() => {
    const rows = Array.isArray(billingConceptsQuery.data)
      ? billingConceptsQuery.data
      : Array.isArray(billingConceptsQuery.data?.items)
        ? billingConceptsQuery.data.items
        : [];

    return rows;
  }, [billingConceptsQuery.data]);

  const isAdminOrSecretary = ["ADMIN", "SECRETARY"].some((role) => safeUpper(activeRole).startsWith(role));
  const lockEdition = activeEditor !== null;

  const upcomingCharges = Array.isArray(debtsSummary?.upcomingCharges) ? debtsSummary.upcomingCharges.slice(0, 3) : [];

  const openEditor = (editorKey) => {
    if (lockEdition && activeEditor !== editorKey) return;
    setActiveEditor(editorKey);
  };

  const openConfirmEnrollment = () => {
    setEnrollmentForm({
      monthlyFee: enrollment?.monthlyFee ? String(enrollment.monthlyFee) : "",
      discountsDescription: enrollment?.discountsDescription || "",
      observations: enrollment?.observations || "",
    });
    setConfirmEnrollmentOpen(true);
  };

  const handleConfirmEnrollment = async () => {
    const monthlyFee = Number(enrollmentForm.monthlyFee);
    if (Number.isNaN(monthlyFee) || monthlyFee < 0) return;

    const payload = {
      studentId,
      monthlyFee,
      discountsDescription: enrollmentForm.discountsDescription.trim() || undefined,
      observations: enrollmentForm.observations.trim() || undefined,
      classroomId: enrollmentStatus?.classroomId || enrollmentStatus?.classroom?.id || enrollment?.classroomId,
      cycleId: enrollmentStatus?.cycleId || enrollmentStatus?.cycle?.id || enrollment?.cycleId,
    };

    await confirmEnrollmentMutation.mutateAsync({
      enrollmentId: enrollment?.id,
      payload,
    });

    setConfirmEnrollmentOpen(false);
  };

  const handleTransfer = async () => {
    if (!transferReason.trim()) return;
    await transferMutation.mutateAsync({ status: "TRANSFERRED", reason: transferReason.trim() });
    setTransferOpen(false);
    setTransferReason("");
  };

  const handleChangeClassroom = async () => {
    if (!canConfirmClassroomChange) return;
    await changeClassroomMutation.mutateAsync({ classroomId: resolvedSelectedClassroomId });
    setChangeClassroomOpen(false);
    setSelectedClassroomId("");
  };


  const handleSaveIdentity = async (formValues) => {
    const payload = {
      names: String(formValues?.names || "").trim(),
      lastNames: String(formValues?.lastNames || "").trim(),
      dni: String(formValues?.dni || "").trim(),
    };

    if (!payload.names || !payload.lastNames || !payload.dni) return;

    await updateIdentityMutation.mutateAsync(payload);
    setActiveEditor(null);
  };

  const handleSaveNotes = async (notes) => {
    await updateNotesMutation.mutateAsync({ internalNotes: String(notes || "") });
    setActiveEditor(null);
  };

  const handleCreateCharge = async () => {
    const amount = Number(chargeForm.amount);
    if (!chargeForm.billingConceptId || Number.isNaN(amount) || amount <= 0 || !chargeForm.dueDate) return;

    await createChargeMutation.mutateAsync({
      studentId,
      billingConceptId: chargeForm.billingConceptId,
      amount,
      dueDate: chargeForm.dueDate,
      observation: chargeForm.observation.trim() || undefined,
    });

    setCreateChargeOpen(false);
    setChargeForm(initialChargeForm);
  };

  if (detailQuery.isLoading) return <StudentDetailSkeleton />;

  if (detailQuery.isError) {
    return (
      <Card className="border border-red-100">
        <p className="text-sm text-red-700">{getErrorMessage(detailQuery.error, "No se pudo cargar el expediente del alumno.")}</p>
        <div className="mt-3">
          <SecondaryButton onClick={() => navigate(ROUTES.dashboardStudents)}>Volver</SecondaryButton>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <Card className="sticky top-0 z-20 border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">{fullName(student)}</h1>
            <p className="text-sm text-gray-600">
              {student.internalCode || "COD_SIN_ASIGNAR"} · DNI: {student.dni || "-"}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">Sede: {student.campusCode || "-"}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">Nivel: {student.level || "-"}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
                Grado-Sección: {enrollmentStatus.classroomName || enrollmentStatus.classroom?.displayName || "-"}
              </span>
              <span className={`rounded-full px-2 py-1 font-semibold ${statusChipClass(status)}`}>Estado: {status}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            {status === "ABSENT" && <Button onClick={openConfirmEnrollment}>Confirmar matrícula</Button>}
            <SecondaryButton onClick={() => navigate(ROUTES.dashboardStudents)}>Volver</SecondaryButton>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Card className="border border-gray-200 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Identidad</h3>
              <SecondaryButton disabled={lockEdition && activeEditor !== "identity"} onClick={() => openEditor("identity")}>
                Editar
              </SecondaryButton>
            </div>
            <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
              <p><span className="font-medium">Nombres:</span> {student.names || "-"}</p>
              <p><span className="font-medium">Apellidos:</span> {student.lastNames || "-"}</p>
              <p><span className="font-medium">DNI:</span> {student.dni || "-"}</p>
              <p><span className="font-medium">Código:</span> {student.internalCode || "-"}</p>
              <p><span className="font-medium">F. nacimiento:</span> {student.birthDate || "-"}</p>
              <p><span className="font-medium">Estado registro:</span> {student.isActive ? "Activo" : "Inactivo"}</p>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tutores y familia</h3>
              <SecondaryButton disabled={lockEdition && activeEditor !== "tutors"} onClick={() => openEditor("tutors")}>
                Gestionar
              </SecondaryButton>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              {tutors.length ? (
                tutors.map((tutor, index) => (
                  <div key={`${tutor.id || tutor._id || "tutor"}-${index}`} className="rounded-md border border-gray-200 p-3">
                    <p className="font-medium text-gray-900">{tutor.isPrimary ? "Tutor principal" : `Tutor ${index + 1}`}</p>
                    <p>{`${tutor.lastNames || ""}, ${tutor.names || ""}`.replace(/^,\s*/, "").trim() || "-"}</p>
                    <p>Relación: {tutor.relationship || "-"}</p>
                    <p>Teléfono: {(Array.isArray(tutor.phones) ? tutor.phones.filter(Boolean).join(" - ") : tutor.phone) || "-"}</p>
                  </div>
                ))
              ) : (
                <p>Sin tutores vinculados.</p>
              )}
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Matrícula</h3>
              {status === "ABSENT" && isAdminOrSecretary && (
                <SecondaryButton onClick={openConfirmEnrollment}>Confirmar matrícula</SecondaryButton>
              )}
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p>Estado del ciclo: <span className="font-medium">{status}</span></p>
              <p>Aula actual: {enrollmentStatus.classroomName || enrollmentStatus.classroom?.displayName || "-"}</p>
              <p>Ciclo actual: {enrollmentStatus.cycleName || enrollmentStatus.cycle?.name || "-"}</p>
              <p>Enrollment ID: {enrollment?.id || "Sin enrollment"}</p>
            </div>

            {!enrollment?.id ? (
              <p className="mt-3 text-sm text-gray-600">Sin matrícula confirmada.</p>
            ) : (
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <p>Pensión mensual: {formatMoney(enrollment?.monthlyFee || detail?.financial?.monthlyFee)}</p>
                <p>Descuentos / exoneraciones: {enrollment?.discountsDescription || "-"}</p>
                <p>Observaciones: {enrollment?.observations || "-"}</p>
                <p>Fecha confirmación: {enrollment?.confirmedAt?.slice?.(0, 10) || "-"}</p>
              </div>
            )}
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notas internas</h3>
              <SecondaryButton disabled={lockEdition && activeEditor !== "notes"} onClick={() => openEditor("notes")}>
                Editar
              </SecondaryButton>
            </div>
            <textarea
              readOnly
              value={internalNotes || "Sin notas internas"}
              className="min-h-[120px] w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card className="border border-gray-200 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Estado académico</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>Ciclo actual: {enrollmentStatus.cycleName || enrollmentStatus.cycle?.name || "-"}</p>
              <p>Aula actual: {enrollmentStatus.classroomName || enrollmentStatus.classroom?.displayName || "-"}</p>
              <p>Estado: {status}</p>
            </div>
            <div className="mt-3">
              <SecondaryButton disabled={!isAdminOrSecretary} onClick={() => setChangeClassroomOpen(true)}>
                Cambiar aula
              </SecondaryButton>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Finanzas</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>Deuda total: {formatMoney(debtsSummary.pendingTotal)}</p>
              <p>Vencido: {formatMoney(debtsSummary.overdueTotal)}</p>
              <div>
                <p className="font-medium text-gray-900">Próximos cargos:</p>
                <ul className="list-inside list-disc text-sm text-gray-600">
                  {upcomingCharges.length ? (
                    upcomingCharges.map((charge, index) => (
                      <li key={`${charge.id || charge.concept || "charge"}-${index}`}>
                        {charge.concept || charge.name || "Cargo"} - {formatMoney(charge.amount)}
                      </li>
                    ))
                  ) : (
                    <li>Sin cargos próximos.</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <SecondaryButton disabled={lockEdition && activeEditor !== "accountStatement"} onClick={() => openEditor("accountStatement")}>
                Ver estado de cuenta
              </SecondaryButton>
              <SecondaryButton disabled={!isAdminOrSecretary} onClick={() => setPaymentModalOpen(true)}>
                Registrar pago
              </SecondaryButton>
              <SecondaryButton disabled={!isAdminOrSecretary} onClick={() => setCreateChargeOpen(true)}>
                Crear cargo
              </SecondaryButton>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Acciones</h3>
            <div className="space-y-2">
              <SecondaryButton
                className="w-full border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => setTransferOpen(true)}
                disabled={!isAdminOrSecretary || status === "TRANSFERRED"}
              >
                Marcar como trasladado
              </SecondaryButton>
            </div>
          </Card>
        </div>
      </div>

      <IdentityEditModal
        open={activeEditor === "identity"}
        onClose={() => setActiveEditor(null)}
        student={student}
        onSave={handleSaveIdentity}
        saving={updateIdentityMutation.isPending}
        errorMessage={updateIdentityMutation.isError ? getErrorMessage(updateIdentityMutation.error, "No se pudo guardar la identidad") : ""}
      />
      <TutorsManageModal open={activeEditor === "tutors"} onClose={() => setActiveEditor(null)} tutors={tutors} />
      <AccountStatementModal
        open={activeEditor === "accountStatement"}
        onClose={() => setActiveEditor(null)}
        debtsSummary={debtsSummary}
        accountQuery={accountStatementQuery}
        onOpenRegisterPayment={() => setPaymentModalOpen(true)}
      />
      <RegisterPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        fixedStudent={{
          id: studentId,
          names: student?.names,
          lastNames: student?.lastNames,
          dni: student?.dni,
        }}
        title="Registrar pago del alumno"
      />
      <NotesEditModal
        open={activeEditor === "notes"}
        onClose={() => setActiveEditor(null)}
        value={internalNotes}
        onSave={handleSaveNotes}
        saving={updateNotesMutation.isPending}
        errorMessage={updateNotesMutation.isError ? getErrorMessage(updateNotesMutation.error, "No se pudo guardar las notas") : ""}
      />

      <BaseModal
        open={confirmEnrollmentOpen}
        onClose={() => setConfirmEnrollmentOpen(false)}
        title="Confirmar matrícula"
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setConfirmEnrollmentOpen(false)} disabled={confirmEnrollmentMutation.isPending}>
              Cancelar
            </SecondaryButton>
            <Button onClick={handleConfirmEnrollment} disabled={confirmEnrollmentMutation.isPending}>
              Confirmar matrícula
            </Button>
          </div>
        }
      >
        <div className="relative space-y-3 p-5">
          <Input
            label="Pensión mensual"
            type="number"
            min="0"
            value={enrollmentForm.monthlyFee}
            onChange={(e) => setEnrollmentForm((prev) => ({ ...prev, monthlyFee: e.target.value }))}
          />
          <label className="block text-sm font-medium text-gray-700">Descuentos / exoneraciones</label>
          <textarea
            value={enrollmentForm.discountsDescription}
            onChange={(e) => setEnrollmentForm((prev) => ({ ...prev, discountsDescription: e.target.value }))}
            className="min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <label className="block text-sm font-medium text-gray-700">Observaciones</label>
          <textarea
            value={enrollmentForm.observations}
            onChange={(e) => setEnrollmentForm((prev) => ({ ...prev, observations: e.target.value }))}
            className="min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {confirmEnrollmentMutation.isError && (
            <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{getErrorMessage(confirmEnrollmentMutation.error)}</p>
          )}
          <LoadingOverlay open={confirmEnrollmentMutation.isPending}>
            <Spinner />
            <p className="mt-3 text-sm">Confirmando matrícula...</p>
          </LoadingOverlay>
        </div>
      </BaseModal>

      <BaseModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Marcar como trasladado"
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setTransferOpen(false)} disabled={transferMutation.isPending}>Cancelar</SecondaryButton>
            <Button onClick={handleTransfer} disabled={transferMutation.isPending || !transferReason.trim()}>Confirmar</Button>
          </div>
        }
      >
        <div className="space-y-3 p-5 text-sm text-gray-700">
          <label className="block text-sm font-medium text-gray-700">Motivo</label>
          <textarea
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            className="min-h-[110px] w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {transferMutation.isError && (
            <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{getErrorMessage(transferMutation.error)}</p>
          )}
        </div>
      </BaseModal>

      <BaseModal
        open={changeClassroomOpen}
        onClose={() => setChangeClassroomOpen(false)}
        title="Cambiar aula"
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setChangeClassroomOpen(false)} disabled={changeClassroomMutation.isPending}>
              Cancelar
            </SecondaryButton>
            <Button onClick={handleChangeClassroom} disabled={changeClassroomMutation.isPending || !canConfirmClassroomChange}>
              Confirmar cambio
            </Button>
          </div>
        }
      >
        <div className="space-y-3 p-5 text-sm text-gray-700">
          <label className="block text-sm font-medium text-gray-700">Aula destino</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
          >
            <option value="">Selecciona un aula</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.displayName || `${classroom.grade || ""} - ${classroom.section || ""}`.trim()}
              </option>
            ))}
          </select>

          {selectedClassroomCapacityQuery.isFetching && <p>Cargando cupo real...</p>}
          {selectedClassroomCapacity && (
            <div className="rounded-md bg-gray-50 p-3 text-sm">
              <p>Capacidad: {selectedClassroomCapacity.capacity}</p>
              <p>Ocupados: {selectedClassroomCapacity.occupied}</p>
              <p>Disponibles: {selectedClassroomCapacity.available}</p>
            </div>
          )}
          {selectedClassroomCapacity && selectedClassroomCapacity.available <= 0 && (
            <p className="text-xs text-red-600">No hay cupos disponibles en el aula seleccionada.</p>
          )}
          {changeClassroomMutation.isError && (
            <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{getErrorMessage(changeClassroomMutation.error)}</p>
          )}
        </div>
      </BaseModal>

      <BaseModal
        open={createChargeOpen}
        onClose={() => setCreateChargeOpen(false)}
        title="Crear cargo"
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setCreateChargeOpen(false)} disabled={createChargeMutation.isPending}>Cancelar</SecondaryButton>
            <Button onClick={handleCreateCharge} disabled={createChargeMutation.isPending}>Crear cargo</Button>
          </div>
        }
      >
        <div className="space-y-3 p-5 text-sm text-gray-700">
          <label className="block text-sm font-medium text-gray-700">Concepto</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            value={chargeForm.billingConceptId}
            onChange={(e) => setChargeForm((prev) => ({ ...prev, billingConceptId: e.target.value }))}
          >
            <option value="">Selecciona un concepto</option>
            {billingConcepts.map((concept) => (
              <option key={concept.id} value={concept.id}>
                {concept.name || concept.code || concept.label || "Concepto"}
              </option>
            ))}
          </select>
          <Input
            label="Monto"
            type="number"
            min="0"
            value={chargeForm.amount}
            onChange={(e) => setChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <Input
            label="Fecha vencimiento"
            type="date"
            value={chargeForm.dueDate}
            onChange={(e) => setChargeForm((prev) => ({ ...prev, dueDate: e.target.value }))}
          />
          <label className="block text-sm font-medium text-gray-700">Observación</label>
          <textarea
            value={chargeForm.observation}
            onChange={(e) => setChargeForm((prev) => ({ ...prev, observation: e.target.value }))}
            className="min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {createChargeMutation.isError && (
            <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{getErrorMessage(createChargeMutation.error)}</p>
          )}
        </div>
      </BaseModal>
    </div>
  );
}
