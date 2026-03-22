import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useAuth } from "../../../lib/auth";
import { useStudentDetailQuery } from "../hooks/useStudentDetailQuery";
import { useClassroomOptionsQuery } from "../hooks/useClassroomOptionsQuery";
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

function toDateTimeString(dateValue) {
  const normalized = String(dateValue || "").trim();
  if (!normalized) return "";
  return `${normalized}T00:00:00.000Z`;
}

function isObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || "").trim());
}
const initialChargeForm = {
  billingConceptId: "",
  amount: "",
  hasDueDate: false,
  dueDate: "",
  observation: "",
};

export default function StudentDetailPage() {
  const { activeRole } = useAuth();
  const { studentId } = useParams();
  const [activeEditor, setActiveEditor] = useState(null);
  const [transferReason, setTransferReason] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [changeClassroomOpen, setChangeClassroomOpen] = useState(false);
  const [createChargeOpen, setCreateChargeOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState(initialChargeForm);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [identityFormError, setIdentityFormError] = useState("");
  const [classroomChangeError, setClassroomChangeError] = useState("");

  const detailQuery = useStudentDetailQuery(studentId);
  const detail = detailQuery.data || {};

  const student = detail.student || {};
  const tutorLink = detail.tutorLink || detail.familyLink || {};
  const enrollmentStatus = detail.enrollmentStatus || {};
  const debtsSummary = detail.debtsSummary || {};
  const enrollment = detail.enrollment || {};

  const status = safeUpper(enrollmentStatus?.cycle?.status || "?");
  const internalNotes = detail.internalNotes || student.internalNotes || "";

  const billingConceptsQuery = useBillingConceptsQuery();

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
    const primaryTutorBase = tutorLink?.primaryTutor || tutorLink?.primaryTutor_send;
    const primaryTutor = primaryTutorBase
      ? { ...primaryTutorBase, isPrimary: true }
      : null;
    const others = Array.isArray(tutorLink?.otherTutors)
      ? tutorLink.otherTutors
      : Array.isArray(tutorLink?.otherTutors_send)
        ? tutorLink.otherTutors_send
        : [];
    return [primaryTutor, ...others].filter(Boolean);
  }, [tutorLink]);

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
    if (editorKey === "identity") updateIdentityMutation.reset();
    if (editorKey === "notes") updateNotesMutation.reset();
    setActiveEditor(editorKey);
  };

  const handleTransfer = async () => {
    if (!transferReason.trim()) return;
    await transferMutation.mutateAsync({ status: "TRANSFERRED", reason: transferReason.trim() });
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

    if (payload.birthDate) {
      payload.birthDate = toDateTimeString(payload.birthDate);
    }

    if (!Object.keys(payload).length) {
      return { error: "No hay cambios para guardar." };
    }

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
  };

  const handleSaveNotes = async (notes) => {
    await updateNotesMutation.mutateAsync({ internalNotes: String(notes || "") });
  };

  const handleCreateCharge = async () => {
    const amount = Number(chargeForm.amount);
    if (!chargeForm.billingConceptId || Number.isNaN(amount) || amount <= 0) return;
    if (chargeForm.hasDueDate && !chargeForm.dueDate) return;

    const selectedConcept = billingConcepts.find((concept) => {
      const conceptValue = String(concept?.id || concept?._id || concept?.code || concept?.name || "").trim();
      return conceptValue === String(chargeForm.billingConceptId || "").trim();
    });

    const selectedBillingConceptId = String(selectedConcept?.id || selectedConcept?._id || "").trim();
    const selectedConceptName = String(selectedConcept?.name || selectedConcept?.code || chargeForm.billingConceptId || "").trim();

    await createChargeMutation.mutateAsync({
      studentId,
      ...(isObjectId(selectedBillingConceptId)
        ? { billingConceptId: selectedBillingConceptId }
        : { conceptName: selectedConceptName }),
      amount,
      dueDate: chargeForm.hasDueDate ? chargeForm.dueDate : undefined,
      observation: chargeForm.observation.trim() || undefined,
    });
  };

  if (detailQuery.isLoading) return <StudentDetailSkeleton />;

  if (detailQuery.isError) {
    return (
      <Card className="border border-red-100">
        <p className="text-sm text-red-700">{getErrorMessage(detailQuery.error, "No se pudo cargar el expediente del alumno.")}</p>
        <div className="mt-3">
          <SecondaryButton onClick={() => window.history.back()}>Volver</SecondaryButton>
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
        onGoBack={() => window.history.back()}
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
          />

          <Card className="border border-gray-200 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Matrícula</h3>
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
          updateIdentityMutation.reset();
          setActiveEditor(null);
        }}
        student={student}
        onSave={handleSaveIdentity}
        saving={updateIdentityMutation.isPending}
        success={updateIdentityMutation.isSuccess}
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
          updateNotesMutation.reset();
          setActiveEditor(null);
        }}
        value={internalNotes}
        onSave={handleSaveNotes}
        saving={updateNotesMutation.isPending}
        success={updateNotesMutation.isSuccess}
        errorMessage={updateNotesMutation.isError ? getErrorMessage(updateNotesMutation.error, "No se pudo guardar las notas") : ""}
      />

      <TransferStudentModal
        open={transferOpen}
        onClose={() => {
          transferMutation.reset();
          setTransferOpen(false);
        }}
        reason={transferReason}
        setReason={setTransferReason}
        onConfirm={handleTransfer}
        isPending={transferMutation.isPending}
        isSuccess={transferMutation.isSuccess}
        errorMessage={transferMutation.isError ? getErrorMessage(transferMutation.error) : ""}
      />

      <ChangeClassroomModal
        open={changeClassroomOpen}
        onClose={() => {
          setClassroomChangeError("");
          changeClassroomMutation.reset();
          setChangeClassroomOpen(false);
        }}
        classrooms={classrooms}
        currentClassroomId={currentClassroomId}
        onSave={handleClassroomChange}
        isLoading={classroomOptionsQuery.isLoading}
        isError={classroomOptionsQuery.isError}
        mutationPending={changeClassroomMutation.isPending}
        mutationSuccess={changeClassroomMutation.isSuccess}
        mutationErrorMessage={classroomChangeError || (changeClassroomMutation.isError ? getErrorMessage(changeClassroomMutation.error, "No se pudo cambiar el aula") : "")}
      />

      <CreateChargeModal
        open={createChargeOpen}
        onClose={() => {
          createChargeMutation.reset();
          setCreateChargeOpen(false);
        }}
        chargeForm={chargeForm}
        setChargeForm={setChargeForm}
        billingConcepts={billingConcepts}
        onCreate={handleCreateCharge}
        isPending={createChargeMutation.isPending}
        isSuccess={createChargeMutation.isSuccess}
        errorMessage={createChargeMutation.isError ? getErrorMessage(createChargeMutation.error) : ""}
      />
    </div>
  );
}
