import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LinkStudentModal from "../components/LinkStudentModal";
import CreateStudentInlineModal from "../components/CreateStudentInlineModal";
import CreateTutorModal from "../components/CreateTutorModal";
import PrimaryTutorConfirmModal from "../components/PrimaryTutorConfirmModal";
import { useFamilyDetailQuery } from "../hooks/useFamilyDetailQuery";
import { useLinkStudentMutation } from "../hooks/useLinkStudentMutation";
import { useCreateTutorMutation } from "../hooks/useCreateTutorMutation";
import { useCreateFamilyStudentMutation } from "../hooks/useCreateFamilyStudentMutation";
import { useUpdateFamilyPrimaryTutorMutation } from "../hooks/useUpdateFamilyPrimaryTutorMutation";
import { getFamilyIdLabel, getStudents, getTutors } from "../domain/familyDisplay";

function tutorFullName(tutor) {
  return [tutor?.tutorPerson?.lastNames, tutor?.tutorPerson?.names].filter(Boolean).join(", ") || "Sin nombre";
}

function getTutorId(tutor) {
  return tutor?.id || tutor?._id || tutor?.tutorId || null;
}

export default function FamilyDetailPage() {
  const { familyId } = useParams();
  const [linkOpen, setLinkOpen] = useState(false);
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [createTutorOpen, setCreateTutorOpen] = useState(false);
  const [primaryTutorModalOpen, setPrimaryTutorModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);

  const familyQuery = useFamilyDetailQuery(familyId);
  const linkMutation = useLinkStudentMutation();
  const createTutorMutation = useCreateTutorMutation();
  const createStudentMutation = useCreateFamilyStudentMutation();
  const updatePrimaryTutorMutation = useUpdateFamilyPrimaryTutorMutation();

  const familyData = familyQuery.data || {};
  const tutors = useMemo(() => getTutors(familyQuery.data), [familyQuery.data]);
  const students = useMemo(() => getStudents(familyQuery.data), [familyQuery.data]);

  console.log("[familyDetail][dbg] content: ", familyData)

  const linkedStudentIds = useMemo(
    () => students.map((student) => student?.id).filter(Boolean),
    [students],
  );

  const primaryTutor = familyData?.primaryTutor || familyData?.primaryTutor_send;
  const otherTutors = familyData?.otherTutors || familyData?.otherTutors_send;

  const handleLinkStudent = async (studentId) => {
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

  if (familyQuery.isLoading) return <Card className="border border-gray-200">Cargando familia...</Card>;

  return (
    <div className="space-y-4">

      <Card className="border border-gray-200 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Resumen</h3>
        <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
          <p><span className="font-medium">Family ID:</span> {getFamilyIdLabel(familyData)}</p>
          <p><span className="font-medium">Tutor principal:</span> {primaryTutor ? tutorFullName(primaryTutor) : "Sin tutor principal"}</p>
          <p><span className="font-medium">DNI tutor:</span> {primaryTutor?.tutorPerson?.dni || "?"}</p>
          <p><span className="font-medium">Teléfono:</span> {primaryTutor?.tutorPerson?.phone || "?"}</p>
        </div>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Tutores</h3>
        <div className="space-y-2 text-sm">
          {tutors.length ? tutors.map((tutor, index) => {
            const isPrimary = Boolean(tutor?.isPrimary) || String(getTutorId(tutor)) === String(getTutorId(primaryTutor));
            return (
              <div key={`${getTutorId(tutor) || index}`} className="rounded-md border border-gray-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-gray-900">{tutorFullName(tutor)}</p>
                  {isPrimary ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Principal</span>
                  ) : (
                    <SecondaryButton className="px-2 py-1 text-xs" onClick={() => openChangePrimaryTutorModal(tutor)}>
                      Hacer principal
                    </SecondaryButton>
                  )}
                </div>
                <p>Relación: {tutor.relationship || "?"}</p>
                <p>DNI: {tutor.tutorPerson?.dni || "?"} · Celular: {tutor.tutorPerson?.phone || "?"}</p>
              </div>
            );
          }) : <p className="text-gray-500">Sin tutores registrados.</p>}
        </div>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Hijos / alumnos vinculados</h3>
        <div className="space-y-2 text-sm">
          {students.length ? students.map((student) => (
            <div key={student._id} className="rounded-md border border-gray-200 p-3">
              {[student.personId?.lastNames, student.personId?.names].filter(Boolean).join(", ") || "Sin nombre"} · DNI: {student.personId?.dni || "-"}
            </div>
          )) : <p className="text-gray-500">Sin alumnos vinculados.</p>}
        </div>
      </Card>

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
        tutorName={tutorFullName(selectedTutor)}
        onConfirm={handleChangePrimaryTutor}
      />
    </div>
  );
}
