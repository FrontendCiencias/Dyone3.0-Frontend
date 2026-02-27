import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useAuth } from "../../../lib/auth";
import { ROUTES } from "../../../config/routes";
import { useStudentDetailQuery } from "../hooks/useStudentDetailQuery";
import { useClassroomOptionsQuery } from "../hooks/useClassroomOptionsQuery";
import { useConfirmEnrollmentMutation } from "../hooks/useConfirmEnrollmentMutation";
import { useUpdateStudentCycleStatusMutation } from "../hooks/useUpdateStudentCycleStatusMutation";
import { useChangeStudentClassroomMutation } from "../hooks/useChangeStudentClassroomMutation";
import { useCreateStudentChargeMutation } from "../hooks/useCreateStudentChargeMutation";
import { useUpdateStudentIdentityMutation } from "../hooks/useUpdateStudentIdentityMutation";
import { useUpdateStudentInternalNotesMutation } from "../hooks/useUpdateStudentInternalNotesMutation";
import { useBillingConceptsQuery } from "../../admin/hooks/useBillingConceptsQuery";
import RegisterPaymentModal from "../../payments/components/RegisterPaymentModal";
import { useStudentAccountStatementQuery } from "../../payments/hooks/useStudentAccountStatementQuery";
import IdentityEditModal from "../components/detail/modals/IdentityEditModal";
import AccountStatementModal from "../components/detail/modals/AccountStatementModal";
import NotesEditModal from "../components/detail/modals/NotesEditModal";
import ConfirmEnrollmentModal from "../components/detail/modals/ConfirmEnrollmentModal";
import TransferStudentModal from "../components/detail/modals/TransferStudentModal";
import ChangeClassroomModal from "../components/detail/modals/ChangeClassroomModal";
import CreateChargeModal from "../components/detail/modals/CreateChargeModal";
import StudentDetailHeader from "../components/detail/cards/StudentDetailHeader";
import StudentDetailSkeleton from "../components/detail/cards/StudentDetailSkeleton";
import StudentIdentityCard from "../components/detail/cards/StudentIdentityCard";
import StudentFamilyCard from "../components/detail/cards/StudentFamilyCard";
import StudentAcademicCard from "../components/detail/cards/StudentAcademicCard";
import StudentFinanceCard from "../components/detail/cards/StudentFinanceCard";

function safeUpper(value) {
  return String(value || "").toUpperCase();
}

function getErrorMessage(error, fallback = "No se pudo completar la operación") {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return fallback;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${amount.toFixed(2)}`;
}


function isObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || "").trim());
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
  const [confirmEnrollmentOpen, setConfirmEnrollmentOpen] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState(initialEnrollmentForm);
  const [createChargeOpen, setCreateChargeOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState(initialChargeForm);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [identityFormError, setIdentityFormError] = useState("");
  const [classroomChangeError, setClassroomChangeError] = useState("");

  const detailQuery = useStudentDetailQuery(studentId);
  const detail = detailQuery.data || {};

  const student = detail.student || {};
  const familyLink = detail.familyLink || {};
  const enrollmentStatus = detail.enrollmentStatus || {};
  const debtsSummary = detail.debtsSummary || {};
  const enrollment = detail.enrollment || {};

  const status = safeUpper(enrollmentStatus?.cycle?.status || "?");
  const internalNotes = detail.internalNotes || student.internalNotes || "";

  const billingConceptsQuery = useBillingConceptsQuery();

  const confirmEnrollmentMutation = useConfirmEnrollmentMutation(studentId);
  const transferMutation = useUpdateStudentCycleStatusMutation(studentId);
  const changeClassroomMutation = useChangeStudentClassroomMutation(studentId);
  const createChargeMutation = useCreateStudentChargeMutation(studentId);
  const updateIdentityMutation = useUpdateStudentIdentityMutation(studentId);
  const updateNotesMutation = useUpdateStudentInternalNotesMutation(studentId);
  const accountStatementQuery = useStudentAccountStatementQuery(studentId, true);

  const currentClassroomId = enrollmentStatus?.classroomId || enrollmentStatus?.classroom?.id || enrollmentStatus?.classroom?._id || enrollment?.classroomId;
  const classroomLevel = enrollmentStatus?.classroom?.level || student?.level;
  const classroomGrade = enrollmentStatus?.classroom?.grade || student?.grade;
  const classroomOptionsQuery = useClassroomOptionsQuery({ level: classroomLevel, grade: classroomGrade });

  const classrooms = useMemo(() => {
    const rows = Array.isArray(classroomOptionsQuery.data?.items) ? classroomOptionsQuery.data.items : [];
    return rows;
  }, [classroomOptionsQuery.data]);

  const tutors = useMemo(() => {
    const primaryTutor = familyLink?.primaryTutor_send
      ? { ...familyLink.primaryTutor_send, isPrimary: true }
      : null;
    const others = Array.isArray(familyLink?.otherTutors_send) ? familyLink.otherTutors_send : [];
    return [primaryTutor, ...others].filter(Boolean);
  }, [familyLink]);

  const familyId = useMemo(() => {
    const candidates = [
      detail?.familyId,
      detail?.family?.id,
      detail?.family?._id,
      familyLink?.familyId,
      familyLink?.id,
      familyLink?._id,
      familyLink?.family?.id,
      familyLink?.family?._id,
    ];

    const match = candidates.find((value) => String(value || "").trim());
    return match ? String(match).trim() : "";
  }, [detail, familyLink]);

  const billingConcepts = useMemo(() => {
    const rows = Array.isArray(billingConceptsQuery.data)
      ? billingConceptsQuery.data
      : Array.isArray(billingConceptsQuery.data?.items)
        ? billingConceptsQuery.data.items
        : [];

    return rows;
  }, [billingConceptsQuery.data]);

  const isAdminOrSecretary = ["ADMIN", "SECRETARY"].includes(safeUpper(activeRole));
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

  const handleClassroomChange = async ({ classroomId, reason }) => {
    const targetClassroomId = String(classroomId || "").trim();
    const cycleId = String(enrollmentStatus?.cycleId || enrollmentStatus?.cycle?.id || enrollment?.cycleId || "").trim();

    if (!isObjectId(targetClassroomId)) {
      setClassroomChangeError("No se pudo identificar el aula seleccionada. Recargue e intente nuevamente.");
      return;
    }

    if (!isObjectId(cycleId)) {
      setClassroomChangeError("No se encontró el ciclo activo del alumno. No es posible cambiar de aula.");
      return;
    }

    setClassroomChangeError("");
    if (String(currentClassroomId || "") === String(targetClassroomId)) return;

    await changeClassroomMutation.mutateAsync({
      classroomId: targetClassroomId,
      cycleId,
      reason: String(reason || "").trim() || undefined,
    });
    setChangeClassroomOpen(false);
  };

  const buildIdentityPayload = (formValues = {}) => {
    const trimOrEmpty = (value) => String(value || "").trim();
    const original = {
      names: trimOrEmpty(student?.names),
      lastNames: trimOrEmpty(student?.lastNames),
      dni: trimOrEmpty(student?.dni),
      birthDate: student?.birthDate ? String(student.birthDate).slice(0, 10) : "",
      gender: trimOrEmpty(student?.gender),
      phone: trimOrEmpty(student?.phone),
      address: trimOrEmpty(student?.address),
    };

    const next = {
      names: trimOrEmpty(formValues?.names),
      lastNames: trimOrEmpty(formValues?.lastNames),
      dni: trimOrEmpty(formValues?.dni),
      birthDate: trimOrEmpty(formValues?.birthDate),
      gender: trimOrEmpty(formValues?.gender),
      phone: trimOrEmpty(formValues?.phone),
      address: trimOrEmpty(formValues?.address),
    };

    if (!next.names && !next.lastNames) return { error: "Debe completar nombres o apellidos." };

    const payload = {};
    ["names", "lastNames", "dni", "birthDate", "gender", "phone", "address"].forEach((key) => {
      if (next[key] !== original[key] && next[key] !== "") payload[key] = next[key];
    });

    return { payload };
  };

  const handleSaveIdentity = async (formValues) => {
    const { payload, error } = buildIdentityPayload(formValues);
    if (error) {
      setIdentityFormError(error);
      return;
    }

    setIdentityFormError("");
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
      <StudentDetailHeader
        status={status}
        campus={enrollmentStatus.campus}
        classroom={enrollmentStatus.classroom || null}
        studentCode={student?.internalCode}
        studentDocument={student?.dni}
        onGoBack={() => navigate(ROUTES.dashboardStudents)}
      />

      <div className=" h-[56.5vh] overflow-y-auto grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <StudentIdentityCard
            student={student}
            disabled={lockEdition && activeEditor !== "identity"}
            onEdit={() => openEditor("identity")}
          />

          <StudentFamilyCard
            tutors={tutors}
            disabled={!familyId}
            onManage={() => {
              if (!familyId) return;
              navigate(ROUTES.dashboardFamilyDetail(familyId));
            }}
            manageDisabledReason={!familyId ? "Sin familia vinculada para gestionar." : ""}
          />

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
          <StudentAcademicCard
            enrollmentStatus={enrollmentStatus}
            status={status}
            canChangeClassroom={isAdminOrSecretary}
            onChangeClassroom={() => setChangeClassroomOpen(true)}
          />

          <StudentFinanceCard
            debtsSummary={debtsSummary}
            upcomingCharges={upcomingCharges}
            disableAccountStatement={lockEdition && activeEditor !== "accountStatement"}
            canManagePayments={isAdminOrSecretary}
            onOpenAccountStatement={() => openEditor("accountStatement")}
            onRegisterPayment={() => setPaymentModalOpen(true)}
            onCreateCharge={() => setCreateChargeOpen(true)}
          />

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
        onClose={() => {
          setIdentityFormError("");
          setActiveEditor(null);
        }}
        student={student}
        onSave={handleSaveIdentity}
        saving={updateIdentityMutation.isPending}
        errorMessage={identityFormError || (updateIdentityMutation.isError ? getErrorMessage(updateIdentityMutation.error, "No se pudo guardar la identidad") : "")}
      />
      <AccountStatementModal
        open={activeEditor === "accountStatement"}
        onClose={() => {
          setIdentityFormError("");
          setActiveEditor(null);
        }}
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
        onClose={() => {
          setIdentityFormError("");
          setActiveEditor(null);
        }}
        value={internalNotes}
        onSave={handleSaveNotes}
        saving={updateNotesMutation.isPending}
        errorMessage={updateNotesMutation.isError ? getErrorMessage(updateNotesMutation.error, "No se pudo guardar las notas") : ""}
      />

      <ConfirmEnrollmentModal
        open={confirmEnrollmentOpen}
        onClose={() => setConfirmEnrollmentOpen(false)}
        form={enrollmentForm}
        setForm={setEnrollmentForm}
        onConfirm={handleConfirmEnrollment}
        isPending={confirmEnrollmentMutation.isPending}
        errorMessage={confirmEnrollmentMutation.isError ? getErrorMessage(confirmEnrollmentMutation.error) : ""}
      />

      <TransferStudentModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        reason={transferReason}
        setReason={setTransferReason}
        onConfirm={handleTransfer}
        isPending={transferMutation.isPending}
        errorMessage={transferMutation.isError ? getErrorMessage(transferMutation.error) : ""}
      />

      <ChangeClassroomModal
        open={changeClassroomOpen}
        onClose={() => {
          setClassroomChangeError("");
          setChangeClassroomOpen(false);
        }}
        classrooms={classrooms}
        currentClassroomId={currentClassroomId}
        onSave={handleClassroomChange}
        isLoading={classroomOptionsQuery.isLoading}
        isError={classroomOptionsQuery.isError}
        mutationPending={changeClassroomMutation.isPending}
        mutationErrorMessage={classroomChangeError || (changeClassroomMutation.isError ? getErrorMessage(changeClassroomMutation.error, "No se pudo cambiar el aula") : "")}
      />

      <CreateChargeModal
        open={createChargeOpen}
        onClose={() => setCreateChargeOpen(false)}
        chargeForm={chargeForm}
        setChargeForm={setChargeForm}
        billingConcepts={billingConcepts}
        onCreate={handleCreateCharge}
        isPending={createChargeMutation.isPending}
        errorMessage={createChargeMutation.isError ? getErrorMessage(createChargeMutation.error) : ""}
      />
    </div>
  );
}
