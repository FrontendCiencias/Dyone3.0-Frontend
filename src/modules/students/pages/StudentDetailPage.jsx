import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useAuth } from "../../../lib/auth";
import { ROUTES } from "../../../config/routes";
import { CAPABILITIES, hasCapability } from "../../auth/utils/capabilities";
import { useStudentDetailQuery } from "../hooks/useStudentDetailQuery";
import { useClassroomOptionsQuery } from "../hooks/useClassroomOptionsQuery";
import { useUpdateEnrollmentStatusMutation } from "../hooks/useUpdateEnrollmentStatusMutation";
import { useChangeStudentClassroomMutation } from "../hooks/useChangeStudentClassroomMutation";
import { useCreateStudentChargeMutation } from "../hooks/useCreateStudentChargeMutation";
import { useUpdateStudentIdentityMutation } from "../hooks/useUpdateStudentIdentityMutation";
import { useUpdateStudentInternalNotesMutation } from "../hooks/useUpdateStudentInternalNotesMutation";
import { useStudentDeletionPreviewQuery } from "../hooks/useStudentDeletionPreviewQuery";
import { useDeleteStudentMutation } from "../hooks/useDeleteStudentMutation";
import { useUpdateTutorMutation } from "../hooks/useUpdateTutorMutation";
import { useDeleteTutorMutation } from "../hooks/useDeleteTutorMutation";
import { useCreateTutorMutation } from "../hooks/useCreateTutorMutation";
import { useBillingConceptsQuery } from "../../admin/hooks/useBillingConceptsQuery";
import RegisterPaymentModal from "../../payments/components/RegisterPaymentModal";
import { useStudentAccountStatementQuery } from "../../payments/hooks/useStudentAccountStatementQuery";
import IdentityEditModal from "../components/detail/modals/IdentityEditModal";
import AccountStatementModal from "../components/detail/modals/AccountStatementModal";
import NotesEditModal from "../components/detail/modals/NotesEditModal";
import TransferStudentModal from "../components/detail/modals/TransferStudentModal";
import ChangeClassroomModal from "../components/detail/modals/ChangeClassroomModal";
import CreateChargeModal from "../components/detail/modals/CreateChargeModal";
import DeleteStudentModal from "../components/detail/modals/DeleteStudentModal";
import TutorsManageModal from "../components/detail/modals/TutorsManageModal";
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
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [activeEditor, setActiveEditor] = useState(null);
  const [transferReason, setTransferReason] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [changeClassroomOpen, setChangeClassroomOpen] = useState(false);
  const [createChargeOpen, setCreateChargeOpen] = useState(false);
  const [deleteStudentOpen, setDeleteStudentOpen] = useState(false);
  const [manageTutorsOpen, setManageTutorsOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState(initialChargeForm);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [identityFormError, setIdentityFormError] = useState("");
  const [classroomChangeError, setClassroomChangeError] = useState("");
  const [tutorManageError, setTutorManageError] = useState("");

  const billingConceptsQuery = useBillingConceptsQuery();

  const deleteStudentMutation = useDeleteStudentMutation(studentId);
  const studentDeleted = deleteStudentMutation.isSuccess;
  const detailQuery = useStudentDetailQuery(studentId, !studentDeleted);
  const detail = detailQuery.data || {};

  const student = detail.student || {};
  const tutorLink = detail.tutorLink || detail.familyLink || {};
  const enrollmentStatus = detail.currentEnrollment || detail.enrollmentStatus || {};
  const debtsSummary = detail.debtsSummary || {};
  const canEditStudentIdentity = hasCapability(activeRole, CAPABILITIES.studentsEditIdentity);
  const canEditStudentNotes = hasCapability(activeRole, CAPABILITIES.studentsEditNotes);
  const canManageTutors = hasCapability(activeRole, CAPABILITIES.studentsManageTutors);
  const canDeleteStudent = hasCapability(activeRole, CAPABILITIES.studentsDelete);
  const canChangeClassroom = hasCapability(activeRole, CAPABILITIES.studentsChangeClassroom);
  const canManagePayments = hasCapability(activeRole, CAPABILITIES.paymentsRegister);
  const canCreateCharge = hasCapability(activeRole, CAPABILITIES.paymentsCreateCharge);

  const status = safeUpper(enrollmentStatus?.status || "?");
  const internalNotes = detail.notes || student.notes || "";
  const transferMutation = useUpdateEnrollmentStatusMutation(studentId, enrollmentStatus?.id);
  const changeClassroomMutation = useChangeStudentClassroomMutation(studentId);
  const createChargeMutation = useCreateStudentChargeMutation(studentId);
  const updateIdentityMutation = useUpdateStudentIdentityMutation(studentId);
  const updateNotesMutation = useUpdateStudentInternalNotesMutation(studentId);
  const updateTutorMutation = useUpdateTutorMutation(studentId);
  const deleteTutorMutation = useDeleteTutorMutation(studentId);
  const createTutorMutation = useCreateTutorMutation(studentId);
  const accountStatementQuery = useStudentAccountStatementQuery(studentId, !studentDeleted);
  const deletionPreviewQuery = useStudentDeletionPreviewQuery(studentId, deleteStudentOpen && !studentDeleted);

  const currentClassroomId = enrollmentStatus?.classroomId || enrollmentStatus?.classroom?.id || enrollmentStatus?.classroom?._id;
  const classroomLevel = enrollmentStatus?.classroom?.level || student?.level;
  const classroomGrade = enrollmentStatus?.classroom?.grade || student?.grade;
  const classroomCampus = enrollmentStatus?.campus?.code || student?.campusCode || null;
  const classroomOptionsQuery = useClassroomOptionsQuery({
    level: canDeleteStudent ? undefined : classroomLevel,
    grade: canDeleteStudent ? undefined : classroomGrade,
    campus: classroomCampus,
  });

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

  const lockEdition = activeEditor !== null;

  useEffect(() => {
    if (!deleteStudentMutation.isSuccess || deleteStudentOpen) return;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("dyone.deletedStudentId");
    }
    deleteStudentMutation.reset();
    navigate(ROUTES.dashboardStudents, { replace: true });
  }, [deleteStudentMutation, deleteStudentMutation.isSuccess, deleteStudentOpen, navigate]);

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
    const cycleId = String(enrollmentStatus?.cycleId || "").trim();

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
      bankCode: trimOrEmpty(student?.bankCode),
      gender: trimOrEmpty(student?.gender),
      phone: trimOrEmpty(student?.phone),
      address: trimOrEmpty(student?.address),
    };

    const next = {
      names: trimOrEmpty(formValues?.names),
      lastNames: trimOrEmpty(formValues?.lastNames),
      dni: trimOrEmpty(formValues?.dni),
      bankCode: trimOrEmpty(formValues?.bankCode),
      gender: trimOrEmpty(formValues?.gender),
      phone: trimOrEmpty(formValues?.phone),
      address: trimOrEmpty(formValues?.address),
    };

    if (!next.names && !next.lastNames) return { error: "Debe completar nombres o apellidos." };
    if (next.bankCode && !/^\d{10}$/.test(next.bankCode)) {
      return { error: "Cod. Caja Arequipa debe tener 10 dígitos." };
    }

    const payload = {};
    ["names", "lastNames", "dni", "bankCode", "gender", "phone", "address"].forEach((key) => {
      if (next[key] !== original[key] && next[key] !== "") payload[key] = next[key];
    });

    if (payload.bankCode && Object.keys(payload).length === 1) {
      payload.names = next.names || original.names;
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

  const handleSaveTutor = async (selectedTutor, formValues) => {
    const tutorId = String(selectedTutor?.id || selectedTutor?._id || "").trim();
    if (!tutorId) {
      setTutorManageError("No se pudo identificar el tutor seleccionado.");
      return;
    }

    const payload = {
      names: String(formValues?.names || "").trim(),
      lastNames: String(formValues?.lastNames || "").trim(),
      dni: String(formValues?.dni || "").trim(),
      phone: String(formValues?.phone || "").trim(),
      gender: String(formValues?.gender || "").trim() || undefined,
      relationship: String(formValues?.relationship || "").trim(),
      isPrimary: Boolean(formValues?.isPrimary),
      livesWithStudent: Boolean(formValues?.livesWithStudent),
      notes: String(formValues?.notes || "").trim(),
    };

    if (!payload.names || !payload.lastNames || !payload.relationship) {
      setTutorManageError("Nombres, apellidos y relacion son obligatorios.");
      return;
    }

    setTutorManageError("");
    await updateTutorMutation.mutateAsync({ tutorId, payload });
  };

  const handleDeleteTutor = async (selectedTutor) => {
    const tutorId = String(selectedTutor?.id || selectedTutor?._id || "").trim();
    if (!tutorId) {
      setTutorManageError("No se pudo identificar el tutor seleccionado.");
      return;
    }

    setTutorManageError("");
    await deleteTutorMutation.mutateAsync(tutorId);
  };

  const handleCreateTutor = async (formValues) => {
    const payload = {
      studentId,
      names: String(formValues?.names || "").trim(),
      lastNames: String(formValues?.lastNames || "").trim(),
      dni: String(formValues?.dni || "").trim(),
      phone: String(formValues?.phone || "").trim(),
      relationship: String(formValues?.relationship || "").trim(),
      isPrimary: Boolean(formValues?.isPrimary),
      livesWithStudent: Boolean(formValues?.livesWithStudent),
      notes: String(formValues?.notes || "").trim(),
    };

    if (!payload.names || !payload.lastNames || !payload.relationship) {
      setTutorManageError("Nombres, apellidos y relacion son obligatorios.");
      return;
    }

    setTutorManageError("");
    await createTutorMutation.mutateAsync(payload);
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
            disabled={!canEditStudentIdentity || (lockEdition && activeEditor !== "identity")}
            onEdit={() => canEditStudentIdentity && openEditor("identity")}
          />

          <StudentFamilyCard
            tutors={tutors}
            canManage={canManageTutors}
            onManage={() => setManageTutorsOpen(true)}
          />

          <Card className="border border-gray-200 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Observaciones del alumno</h3>
              <SecondaryButton
                disabled={!canEditStudentNotes || (lockEdition && activeEditor !== "notes")}
                onClick={() => canEditStudentNotes && openEditor("notes")}
              >
                Editar
              </SecondaryButton>
            </div>
            <textarea
              readOnly
              value={internalNotes || "Sin observaciones"}
              className="min-h-[120px] w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <StudentAcademicCard
            enrollmentStatus={enrollmentStatus}
            status={status}
            canChangeClassroom={canChangeClassroom}
            onChangeClassroom={() => setChangeClassroomOpen(true)}
            canViewEnrollment={Boolean(enrollmentStatus?.id)}
            onViewEnrollment={() => navigate(ROUTES.dashboardEnrollmentDetail(enrollmentStatus.id))}
            cycleName={enrollmentStatus.cycleName}
            confirmedAt={enrollmentStatus.confirmedAt}
          />

          <StudentFinanceCard
            debtsSummary={debtsSummary}
            upcomingCharges={upcomingCharges}
            disableAccountStatement={lockEdition && activeEditor !== "accountStatement"}
            canManagePayments={canManagePayments}
            onOpenAccountStatement={() => openEditor("accountStatement")}
            onRegisterPayment={() => setPaymentModalOpen(true)}
            onCreateCharge={() => canCreateCharge && setCreateChargeOpen(true)}
          />

          <Card className="border border-gray-200 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Acciones</h3>
            <div className="space-y-2">
              <SecondaryButton
                className="w-full border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => setTransferOpen(true)}
                disabled={!canChangeClassroom || status === "TRANSFERRED"}
              >
                Marcar como trasladado
              </SecondaryButton>
              {canDeleteStudent ? (
                <SecondaryButton
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => setDeleteStudentOpen(true)}
                >
                  Eliminar alumno
                </SecondaryButton>
              ) : null}
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
        errorMessage={updateNotesMutation.isError ? getErrorMessage(updateNotesMutation.error, "No se pudo guardar las observaciones") : ""}
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

      <DeleteStudentModal
        open={deleteStudentOpen}
        onClose={() => {
          if (!deleteStudentMutation.isSuccess) {
            deleteStudentMutation.reset();
          }
          setDeleteStudentOpen(false);
        }}
        previewQuery={deletionPreviewQuery}
        onConfirm={() => deleteStudentMutation.mutate()}
        isPending={deleteStudentMutation.isPending}
        isSuccess={deleteStudentMutation.isSuccess}
        errorMessage={
          deleteStudentMutation.isError
            ? getErrorMessage(deleteStudentMutation.error, "No se pudo eliminar el alumno.")
            : deletionPreviewQuery.isError
              ? getErrorMessage(deletionPreviewQuery.error, "No se pudo cargar el resumen de eliminación.")
              : ""
        }
      />

      <TutorsManageModal
        open={manageTutorsOpen}
        onClose={() => {
          setTutorManageError("");
          updateTutorMutation.reset();
          deleteTutorMutation.reset();
          createTutorMutation.reset();
          setManageTutorsOpen(false);
        }}
        tutors={tutors}
        canDelete={canDeleteStudent}
        canCreate={canDeleteStudent}
        onSaveTutor={handleSaveTutor}
        onDeleteTutor={handleDeleteTutor}
        onCreateTutor={handleCreateTutor}
        saving={updateTutorMutation.isPending}
        deleting={deleteTutorMutation.isPending}
        creating={createTutorMutation.isPending}
        success={updateTutorMutation.isSuccess || deleteTutorMutation.isSuccess || createTutorMutation.isSuccess}
        errorMessage={
          tutorManageError ||
          (updateTutorMutation.isError
            ? getErrorMessage(updateTutorMutation.error, "No se pudo actualizar el tutor.")
            : deleteTutorMutation.isError
              ? getErrorMessage(deleteTutorMutation.error, "No se pudo eliminar el tutor.")
              : createTutorMutation.isError
                ? getErrorMessage(createTutorMutation.error, "No se pudo vincular el tutor.")
                : "")
        }
      />
    </div>
  );
}
