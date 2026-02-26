import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LinkStudentModal from "../components/LinkStudentModal";
import CreateStudentInlineModal from "../components/CreateStudentInlineModal";
import CreateTutorModal from "../components/CreateTutorModal";
import PrimaryTutorConfirmModal from "../components/PrimaryTutorConfirmModal";
import TutorsCard from "../components/detail/cards/TutorsCard";
import StudentsCard from "../components/detail/cards/StudentsCard";
import EditTutorModal from "../components/modals/EditTutorModal";
import DeleteTutorConfirmModal from "../components/modals/DeleteTutorConfirmModal";
import UnlinkStudentConfirmModal from "../components/modals/UnlinkStudentConfirmModal";
import { useFamilyDetailQuery } from "../hooks/useFamilyDetailQuery";
import { useLinkStudentMutation } from "../hooks/useLinkStudentMutation";
import { useCreateTutorMutation } from "../hooks/useCreateTutorMutation";
import { useCreateFamilyStudentMutation } from "../hooks/useCreateFamilyStudentMutation";
import { useUpdateFamilyPrimaryTutorMutation } from "../hooks/useUpdateFamilyPrimaryTutorMutation";
import { useDeleteTutorMutation } from "../hooks/useDeleteTutorMutation";
import { useUpdateTutorMutation } from "../hooks/useUpdateTutorMutation";
import { useUnlinkStudentFromFamilyMutation } from "../hooks/useUnlinkStudentFromFamilyMutation";
import {
  getFamilyIdLabel,
  getPrimaryTutor,
  getPrimaryTutorDisplayName,
  getStudents,
  getTutorFullName,
  getTutorId,
  getTutors,
} from "../domain/familyDisplay";

function getStudentId(student) {
  return student?.id || student?._id || student?.studentId || null;
}

export default function FamilyDetailPage() {
  const { familyId } = useParams();
  const [linkOpen, setLinkOpen] = useState(false);
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [createTutorOpen, setCreateTutorOpen] = useState(false);
  const [primaryTutorModalOpen, setPrimaryTutorModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);

  const [editTutorModalOpen, setEditTutorModalOpen] = useState(false);
  const [deleteTutorModalOpen, setDeleteTutorModalOpen] = useState(false);
  const [unlinkStudentModalOpen, setUnlinkStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const familyQuery = useFamilyDetailQuery(familyId);
  const linkMutation = useLinkStudentMutation();
  const createTutorMutation = useCreateTutorMutation();
  const createStudentMutation = useCreateFamilyStudentMutation();
  const updatePrimaryTutorMutation = useUpdateFamilyPrimaryTutorMutation();
  const updateTutorMutation = useUpdateTutorMutation();
  const deleteTutorMutation = useDeleteTutorMutation();
  const unlinkStudentMutation = useUnlinkStudentFromFamilyMutation();

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

  const handleCreateTutor = async (payload) => {
    await createTutorMutation.mutateAsync({ ...payload, familyId });
  };

  const handleCreateStudent = async (studentPayload) => {
    const created = await createStudentMutation.mutateAsync({ ...studentPayload, familyId });
    const studentId = created?.id || created?.student?.id;
    if (!studentId) throw new Error("No se pudo obtener el ID del alumno creado");

    await linkMutation.mutateAsync({ familyId, studentId });
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
    if (!tutorId) return;
    await updateTutorMutation.mutateAsync({ tutorId, familyId, ...payload });
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

  const openUnlinkStudentModal = (student) => {
    setSelectedStudent(student);
    setUnlinkStudentModalOpen(true);
  };

  const handleUnlinkStudent = async () => {
    const studentId = getStudentId(selectedStudent);
    if (!studentId) return;

    await unlinkStudentMutation.mutateAsync({ familyId, studentId });
  };

  if (familyQuery.isLoading) return <Card className="border border-gray-200">Cargando familia...</Card>;

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Resumen</h3>
        <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
          <p><span className="font-medium">Family ID:</span> {getFamilyIdLabel(familyData)}</p>
          <p><span className="font-medium">Tutor principal:</span> {getPrimaryTutorDisplayName(familyData)}</p>
          <p><span className="font-medium">DNI tutor:</span> {primaryTutor?.tutorPerson?.dni || "?"}</p>
          <p><span className="font-medium">Teléfono:</span> {primaryTutor?.tutorPerson?.phone || "?"}</p>
        </div>
      </Card>

      <TutorsCard
        tutors={tutors}
        primaryTutorId={getTutorId(primaryTutor)}
        onMakePrimary={openChangePrimaryTutorModal}
        onEditTutor={openEditTutorModal}
        onDeleteTutor={openDeleteTutorModal}
      />

      <StudentsCard students={students} onUnlinkStudent={openUnlinkStudentModal} />

      <Card className="border border-gray-200 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Acciones</h3>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton onClick={() => setLinkOpen(true)}>Vincular alumno existente</SecondaryButton>
          <SecondaryButton onClick={() => setCreateTutorOpen(true)}>Crear tutor</SecondaryButton>
          <SecondaryButton onClick={() => setCreateStudentOpen(true)}>Crear alumno y vincular</SecondaryButton>
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
      <CreateStudentInlineModal
        open={createStudentOpen}
        onClose={() => setCreateStudentOpen(false)}
        onCreate={handleCreateStudent}
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
      <UnlinkStudentConfirmModal
        open={unlinkStudentModalOpen}
        student={selectedStudent}
        onClose={() => {
          setUnlinkStudentModalOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleUnlinkStudent}
        isPending={unlinkStudentMutation.isPending}
      />
    </div>
  );
}
