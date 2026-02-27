import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
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
import { useLinkStudentMutation } from "../hooks/useLinkStudentMutation";
import { useCreateTutorMutation } from "../hooks/useCreateTutorMutation";
import { useUpdateFamilyPrimaryTutorMutation } from "../hooks/useUpdateFamilyPrimaryTutorMutation";
import { useDeleteTutorMutation } from "../hooks/useDeleteTutorMutation";
import { useUpdateTutorMutation } from "../hooks/useUpdateTutorMutation";
import { useUpdatePersonMutation } from "../hooks/useUpdatePersonMutation";
import {
  getFamilyIdLabel,
  getPrimaryTutor,
  getStudents,
  getTutorFullName,
  getTutorId,
  getTutorPersonId,
  getTutors,
} from "../domain/familyDisplay";

function getStudentId(student) {
  return student?.id || student?._id || student?.studentId || null;
}

export default function FamilyDetailPage() {
  const navigate = useNavigate();
  const { familyId } = useParams();
  const [linkOpen, setLinkOpen] = useState(false);
  const [createTutorOpen, setCreateTutorOpen] = useState(false);
  const [primaryTutorModalOpen, setPrimaryTutorModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);

  const [editTutorModalOpen, setEditTutorModalOpen] = useState(false);
  const [deleteTutorModalOpen, setDeleteTutorModalOpen] = useState(false);

  const familyQuery = useFamilyDetailQuery(familyId);
  const linkMutation = useLinkStudentMutation();
  const createTutorMutation = useCreateTutorMutation();
  const updatePrimaryTutorMutation = useUpdateFamilyPrimaryTutorMutation();
  const updateTutorMutation = useUpdateTutorMutation();
  const updatePersonMutation = useUpdatePersonMutation();
  const deleteTutorMutation = useDeleteTutorMutation();

  const familyData = familyQuery.data || {};
  const tutors = useMemo(() => getTutors(familyQuery.data), [familyQuery.data]);
  const students = useMemo(() => getStudents(familyQuery.data), [familyQuery.data]);
  const primaryTutor = useMemo(() => getPrimaryTutor(familyQuery.data), [familyQuery.data]);

  const linkedStudentIds = useMemo(
    () => students.map((student) => getStudentId(student)).filter(Boolean),
    [students],
  );

  const handleLinkStudent = async (selection) => {
    const studentId = typeof selection === "string" ? selection : selection?.studentId;
    if (!studentId) throw new Error("No se pudo identificar el alumno seleccionado");
    await linkMutation.mutateAsync({ familyId, studentId });
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
    const personId = getTutorPersonId(selectedTutor);

    if (!tutorId) throw new Error("No se pudo identificar el tutor seleccionado");
    if (!personId) throw new Error("No se pudo identificar la persona asociada al tutor");

    await updatePersonMutation.mutateAsync({
      personId,
      familyId,
      names: payload.names,
      lastNames: payload.lastNames,
      dni: payload.dni,
      phone: payload.phone,
    });

    await updateTutorMutation.mutateAsync({
      tutorId,
      familyId,
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


  if (familyQuery.isLoading) return <Card className="border border-gray-200">Cargando familia...</Card>;

  return (
    <div className="space-y-4">
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
        onDeleteTutor={openDeleteTutorModal}
      />

      <StudentsCard students={students} />

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
        isPending={updateTutorMutation.isPending || updatePersonMutation.isPending}
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
