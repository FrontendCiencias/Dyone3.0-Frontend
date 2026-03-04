import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useAuth } from "../../../lib/auth";
import StudentsContextBar from "../../students/components/StudentsContextBar";
import { ROUTES } from "../../../config/routes";
import LinkStudentModal from "../components/LinkStudentModal";
import CreateTutorModal from "../components/CreateTutorModal";
import PrimaryTutorConfirmModal from "../components/PrimaryTutorConfirmModal";
import TutorsCard from "../components/detail/cards/TutorsCard";
import StudentsCard from "../components/detail/cards/StudentsCard";
import EditTutorModal from "../components/modals/EditTutorModal";
import DeleteTutorConfirmModal from "../components/modals/DeleteTutorConfirmModal";
import { useFamilyDetailQuery } from "../hooks/useFamilyDetailQuery";
import { useLinkStudentToFamilyMutation } from "../hooks/useLinkStudentToFamilyMutation";
import { useCreateTutorMutation } from "../hooks/useCreateTutorMutation";
import { useUpdateFamilyPrimaryTutorMutation } from "../hooks/useUpdateFamilyPrimaryTutorMutation";
import { useDeleteTutorMutation } from "../hooks/useDeleteTutorMutation";
import { useUpdateTutorMutation } from "../hooks/useUpdateTutorMutation";
import { useUnlinkStudentFromFamilyMutation } from "../hooks/useUnlinkStudentFromFamilyMutation";
import {
  getFamilyIdLabel,
  getPrimaryTutor,
  getStudents,
  getTutorFullName,
  getTutorId,
  getTutors,
} from "../domain/familyDisplay";

function getStudentId(student) {
  return student?.id || student?._id || student?.studentId || null;
}

function getLinkStudentErrorMessage(error) {
  const status = Number(error?.response?.status || 0);
  const message = error?.response?.data?.message || error?.message || "";
  const normalized = String(Array.isArray(message) ? message.join(". ") : message).toLowerCase();

  if (status === 409 || normalized.includes("already linked")) {
    return "El alumno ya se encuentra vinculado a una familia.";
  }

  return typeof message === "string" && message.trim()
    ? message
    : "No se pudo vincular el alumno. Intenta nuevamente.";
}

export default function FamilyDetailPage() {
  const { activeRole } = useAuth();
  const navigate = useNavigate();
  const { familyId } = useParams();
  const [linkOpen, setLinkOpen] = useState(false);
  const [createTutorOpen, setCreateTutorOpen] = useState(false);
  const [primaryTutorModalOpen, setPrimaryTutorModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [toast, setToast] = useState(null);

  const [editTutorModalOpen, setEditTutorModalOpen] = useState(false);
  const [deleteTutorModalOpen, setDeleteTutorModalOpen] = useState(false);

  const familyQuery = useFamilyDetailQuery(familyId);
  const linkMutation = useLinkStudentToFamilyMutation();
  const createTutorMutation = useCreateTutorMutation();
  const updatePrimaryTutorMutation = useUpdateFamilyPrimaryTutorMutation();
  const updateTutorMutation = useUpdateTutorMutation();
  const deleteTutorMutation = useDeleteTutorMutation();
  const unlinkStudentMutation = useUnlinkStudentFromFamilyMutation();
  const canDeleteTutor = String(activeRole || "").toUpperCase() === "ADMIN";

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const familyData = familyQuery.data || {};
  const tutors = useMemo(() => getTutors(familyQuery.data), [familyQuery.data]);
  const students = useMemo(() => getStudents(familyQuery.data), [familyQuery.data]);
  const primaryTutor = useMemo(() => getPrimaryTutor(familyQuery.data), [familyQuery.data]);

  const linkedStudentIds = useMemo(
    () => students.map((student) => getStudentId(student)).filter(Boolean),
    [students],
  );

  const handleLinkStudent = async (selection) => {
    const studentId = selection?.id || selection?.studentId;
    if (!studentId) throw new Error("No se pudo identificar el alumno seleccionado");

    console.info("[FamilyDetail][LinkStudent] submit", { familyId, studentId });

    try {
      await linkMutation.mutateAsync({ familyId, studentId });
      setToast({ type: "success", message: "Alumno vinculado correctamente." });
      setLinkOpen(false);
      await familyQuery.refetch();
    } catch (error) {
      console.warn("[FamilyDetail][LinkStudent] error", { familyId, studentId, status: error?.response?.status });
      setToast({ type: "error", message: getLinkStudentErrorMessage(error) });
      throw error;
    }
  };

  const studentCodes = useMemo(
    () => students
      .map((student) => student?.code || student?.studentCod || student?.studentCode || student?.internalCode)
      .filter((value) => String(value || "").trim())
      .map((value) => String(value).trim()),
    [students],
  );

  const handleCreateTutor = async (payload) => {
    const normalizedCodes = studentCodes;
    const studentCod = normalizedCodes[0];

    await createTutorMutation.mutateAsync({
      ...payload,
      familyId,
      studentCod,
      studentCods: normalizedCodes,
      studentsCod: normalizedCodes,
    });
  };

  const openChangePrimaryTutorModal = (tutor) => {
    setSelectedTutor(tutor);
    setPrimaryTutorModalOpen(true);
  };

  const handleChangePrimaryTutor = async () => {
    const tutorId = getTutorId(selectedTutor);
    if (!tutorId) throw new Error("No se pudo identificar el tutor seleccionado");

    await updatePrimaryTutorMutation.mutateAsync({ familyId, tutorId });
  };

  const openEditTutorModal = (tutor) => {
    setSelectedTutor(tutor);
    setEditTutorModalOpen(true);
  };

  const handleEditTutor = async (payload) => {
    const tutorId = getTutorId(selectedTutor);
    const tutorPerson = selectedTutor?.tutorPerson || selectedTutor?.person || {};
    const gender = payload.gender ?? tutorPerson?.gender;

    if (!tutorId) throw new Error("No se pudo identificar el tutor seleccionado");

    await updateTutorMutation.mutateAsync({
      tutorId,
      familyId,
      names: payload.names,
      lastNames: payload.lastNames,
      dni: payload.dni,
      phone: payload.phone,
      gender,
      relationship: payload.relationship,
      isPrimary: payload.isPrimary,
      livesWithStudent: payload.livesWithStudent,
      notes: payload.notes,
    });
  };

  const openDeleteTutorModal = (tutor) => {
    setSelectedTutor(tutor);
    setDeleteTutorModalOpen(true);
  };

  const handleDeleteTutor = async () => {
    const tutorId = getTutorId(selectedTutor);
    if (!tutorId) return;

    await deleteTutorMutation.mutateAsync({ tutorId, familyId });
  };



  const handleUnlinkStudent = async (student) => {
    const studentId = getStudentId(student);
    if (!studentId) return;

    const confirmed = window.confirm(
      "¿Deseas desvincular este alumno de la familia?\nEl alumno quedará sin familia.",
    );

    if (!confirmed) return;

    try {
      await unlinkStudentMutation.mutateAsync({ familyId, studentId });
      setToast({ type: "success", message: "Alumno desvinculado correctamente" });
      await familyQuery.refetch();
    } catch (error) {
      setToast({ type: "error", message: "No se pudo desvincular al alumno" });
    }
  };

  if (familyQuery.isLoading) return <Card className="border border-gray-200">Cargando familia...</Card>;

  return (
    <div className="space-y-4">
      {toast ? (
        <div className={`rounded-md border px-3 py-2 text-sm ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {toast.message}
        </div>
      ) : null}
      <Card className="border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <StudentsContextBar items={[`Family ID: ${getFamilyIdLabel(familyData)}`]} />
          </div>

          <div className="flex justify-end">
            <SecondaryButton className="w-full md:w-auto" onClick={() => navigate(ROUTES.dashboardFamilies)}>
              Lista de Familias
            </SecondaryButton>
          </div>
        </div>
      </Card>

      <TutorsCard
        tutors={tutors}
        primaryTutorId={getTutorId(primaryTutor)}
        onMakePrimary={openChangePrimaryTutorModal}
        onEditTutor={openEditTutorModal}
        onDeleteTutor={canDeleteTutor ? openDeleteTutorModal : undefined}
      />

      <StudentsCard
        students={students}
        canUnlink={canDeleteTutor}
        onUnlinkStudent={handleUnlinkStudent}
        unlinkingStudentId={unlinkStudentMutation.variables?.studentId}
      />

      <Card className="border border-gray-200 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Acciones</h3>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton onClick={() => setLinkOpen(true)}>Vincular alumno existente</SecondaryButton>
          <SecondaryButton onClick={() => setCreateTutorOpen(true)} disabled={!studentCodes.length} title={!studentCodes.length ? "La familia no tiene alumnos con código disponible." : undefined}>Crear tutor</SecondaryButton>
          <SecondaryButton onClick={() => navigate(ROUTES.dashboardEnrollmentCaseNew, { state: { prefillFamily: familyData, familyId: getFamilyIdLabel(familyData) } })}>Crear alumno e iniciar matrícula</SecondaryButton>
        </div>
      </Card>

      <LinkStudentModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onConfirm={handleLinkStudent}
        linkedStudentIds={linkedStudentIds}
        isLinking={linkMutation.isPending}
      />
      <CreateTutorModal
        open={createTutorOpen}
        onClose={() => setCreateTutorOpen(false)}
        onCreate={handleCreateTutor}
        endpointReady
      />
      <PrimaryTutorConfirmModal
        open={primaryTutorModalOpen}
        onClose={() => setPrimaryTutorModalOpen(false)}
        tutorName={getTutorFullName(selectedTutor)}
        onConfirm={handleChangePrimaryTutor}
      />
      <EditTutorModal
        open={editTutorModalOpen}
        tutor={selectedTutor}
        onClose={() => {
          setEditTutorModalOpen(false);
          setSelectedTutor(null);
        }}
        onConfirm={handleEditTutor}
        isPending={updateTutorMutation.isPending}
      />
      <DeleteTutorConfirmModal
        open={deleteTutorModalOpen}
        tutor={selectedTutor}
        onClose={() => {
          setDeleteTutorModalOpen(false);
          setSelectedTutor(null);
        }}
        onConfirm={handleDeleteTutor}
        isPending={deleteTutorMutation.isPending}
      />
    </div>
  );
}
