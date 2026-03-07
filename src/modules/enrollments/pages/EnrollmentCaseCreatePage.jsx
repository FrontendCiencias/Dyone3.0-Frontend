import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import { ROUTES } from "../../../config/routes";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useAuth } from "../../../lib/auth";
import { useCyclesQuery } from "../../admin/hooks/useCyclesQuery";
import CreateTutorModal from "../../families/components/CreateTutorModal";
import EditTutorModal from "../../families/components/modals/EditTutorModal";
import { useCreateTutorMutation } from "../../families/hooks/useCreateTutorMutation";
import { useFamilyDetailQuery } from "../../families/hooks/useFamilyDetailQuery";
import { useUpdateTutorMutation } from "../../families/hooks/useUpdateTutorMutation";
import { getAllTutors, getTutorId, getTutors } from "../../families/domain/familyDisplay";
import { createFamily, createTutor, linkStudentToFamily } from "../../families/services/families.service";
import { createStudentWithPerson, getClassroomOptions, getStudentSummary } from "../../students/services/students.service";
import IntakeSearchBar from "../components/IntakeSearchBar";
import FamilySummaryCard from "../components/FamilySummaryCard";
import EnrollmentPackageList from "../components/EnrollmentPackageList";
import RightSummarySidebar from "../components/RightSummarySidebar";
import CreateStudentModal from "../components/CreateStudentModal";
import CreateFamilyFromStudentModal from "../components/CreateFamilyFromStudentModal";
import SearchUnassignedStudentModal from "../components/SearchUnassignedStudentModal";
import CreateStudentWithoutFamilyWizardModal from "../components/CreateStudentWithoutFamilyWizardModal";
import { useEnrollmentIntakeSearchQuery } from "../hooks/useEnrollmentIntakeSearchQuery";
import { confirmEnrollmentById, createQuickEnrollment, getEnrollmentDetailById } from "../services/enrollments.service";
import { ENROLLMENT_CASE_MONTHS, buildPensionArrayFromGeneralAmount } from "../domain/enrollmentCaseValidation";

const INTERNAL_SCHOOLS = new Set(["CIENCIAS", "CIENCIAS_APLICADAS", "CIMAS"]);

function getStudentId(student) {
  return student?.id || student?._id || student?.studentId || "";
}

function toPackageItemFromStudent(student, overrides = {}) {
  console.log("[DBG] [student]: ",student)
  const id = getStudentId(student);
  const fullName = [student?.personId?.lastNames || student?.person?.lastNames, student?.personId?.names || student?.person?.names].filter(Boolean).join(", ");
  const cycleStatus = overrides.cycleStatus || student?.cycleStatus;
  const activeStatus = overrides.activeStatus || student?.activeStatus || "ACTIVE";
  const isReturnTransfer = activeStatus === "INACTIVE" && cycleStatus === "TRANSFERRED";
  const blockedReason = cycleStatus === "ENROLLED" ? "Ya matriculado" : activeStatus === "GRADUATED" ? "Egresado" : "";
  const classroom = student?.classroom || student?.vacancy?.classroom || overrides.classroom;
  const assignedClassroomLabel = classroom?.label || classroom?.name || classroom?.displayName || "";

  const inferredHasVacancy = Boolean(
    classroom?._id ||
    classroom?.id ||
    classroom?.classroomId ||
    assignedClassroomLabel
  );

  const hasVacancy = overrides.hasVacancy ?? student?.hasVacancy ?? inferredHasVacancy;
  if (hasVacancy && !assignedClassroomLabel) {
    console.warn("[NewEnrollment] Student hasVacancy=true but classroom label missing", { studentId: id });
  }
  const previousSchoolType = overrides.previousSchoolType || student?.previousCampus || student?.previousSchoolType || "OTHER";

  return {
    id,
    studentId: id,
    fullName: fullName || "Alumno sin nombre",
    dni: student?.personId?.dni || student?.person?.dni || "",
    familyId: overrides.familyId ?? student?.familyId ?? null,
    activeStatus,
    cycleStatus,
    isReturnTransfer,
    isNew: Boolean(overrides.isNew),
    hasVacancy,
    requiresClassroomSelection: overrides.requiresClassroomSelection ?? !hasVacancy,
    assignedClassroomLabel,
    selectedClassroomId: overrides.selectedClassroomId || "",
    selectedClassroomLabel: overrides.selectedClassroomLabel || "",
    level: overrides.level || student?.level || student?.educationLevel || student?.currentLevel || "",
    grade: overrides.grade || student?.grade || student?.currentGrade || "",
    previousSchoolType,
    blockedReason,
    admissionFee: {
      applies: !INTERNAL_SCHOOLS.has(String(previousSchoolType || "").toUpperCase()) || isReturnTransfer,
      isExempt: false,
      amount: 0,
      reason: "",
    },
    enrollmentFee: {
      isExempt: false,
      amount: 0,
      reason: "",
    },
    pensionGeneral: 0,
    isPensionCustomized: false,
    pensionMonthlyAmounts: buildPensionArrayFromGeneralAmount(0, 0),
  };
}

export default function EnrollmentCaseCreatePage() {
  const navigate = useNavigate();
  const { activeCampus } = useAuth();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draft");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [packageItems, setPackageItems] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [createStudentWithoutFamilyOpen, setCreateStudentWithoutFamilyOpen] = useState(false);
  const [searchStudentOpen, setSearchStudentOpen] = useState(false);
  const [familyModalStudent, setFamilyModalStudent] = useState(null);
  const [enrollmentId, setEnrollmentId] = useState(draftId || "");
  const [payments, setPayments] = useState({ notes: "" });
  const [createTutorOpen, setCreateTutorOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [editTutorModalOpen, setEditTutorModalOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const cyclesQuery = useCyclesQuery();
  const activeCycle = useMemo(() => {
    const rows = Array.isArray(cyclesQuery.data?.items) ? cyclesQuery.data.items : Array.isArray(cyclesQuery.data) ? cyclesQuery.data : [];
    return rows.find((cycle) => cycle?.isActive) || null;
  }, [cyclesQuery.data]);

  const intakeSearchQuery = useEnrollmentIntakeSearchQuery({ q: debouncedQuery, campusScope: activeCampus, enabled: true });
  const intakeResults = Array.isArray(intakeSearchQuery.data?.items) ? intakeSearchQuery.data.items : Array.isArray(intakeSearchQuery.data) ? intakeSearchQuery.data : [];

  // console.log("[DBG] [intakeResults]: ",intakeResults)

  const familyDetailQuery = useFamilyDetailQuery(selectedFamilyId, Boolean(selectedFamilyId));
  const familyData = familyDetailQuery.data || null;
  const tutors = useMemo(() => getAllTutors(familyData), [familyData]);
  const createTutorMutation = useCreateTutorMutation();
  const updateTutorMutation = useUpdateTutorMutation();

  const studentCodes = useMemo(
    () => (Array.isArray(familyData?.students) ? familyData.students : [])
      .map((student) => student?.code || student?.studentCod || student?.studentCode || student?.internalCode)
      .filter((value) => String(value || "").trim())
      .map((value) => String(value).trim()),
    [familyData?.students],
  );

  // console.log("[DBG] [familyData]: ",familyData)
  // console.log("[DBG] [tutors]: ",tutors)

  useEffect(() => {
    if (!familyData) return;
    const students = Array.isArray(familyData?.students) ? familyData.students : [];
    setPackageItems((prev) => {
      const prevMap = new Map(prev.map((item) => [item.studentId, item]));
      const ready = students.map((student) => {
        const base = toPackageItemFromStudent(student, { familyId: selectedFamilyId });
        return prevMap.get(base.studentId) ? { ...base, ...prevMap.get(base.studentId) } : base;
      });
      return ready
    });
  }, [familyData, selectedFamilyId]);

  const enrollmentDetailQuery = useMutation({ mutationFn: getEnrollmentDetailById });
  useEffect(() => {
    if (!draftId) return;
    enrollmentDetailQuery.mutate(draftId, {
      onSuccess: (data) => {
        console.log("[NewEnrollment][Draft] rehydrate");
        setEnrollmentId(data?.id || draftId);
      },
    });
  }, [draftId]);

  const classroomQueries = useQueries({
    queries: packageItems.map((item) => ({
      queryKey: ["classroom-options", item.studentId, item.level, item.grade],
      queryFn: () => getClassroomOptions({ level: item.level, grade: item.grade, includeCapacity: true }),
      enabled: Boolean(item.requiresClassroomSelection && item.level && item.grade),
      retry: false,
    })),
  });

  const studentSummaryQueries = useQueries({
    queries: packageItems.map((item) => ({
      queryKey: ["students", "summary", item.studentId, "enrollment-intake"],
      queryFn: () => getStudentSummary(item.studentId),
      enabled: Boolean(item.studentId),
      staleTime: 60_000,
    })),
  });

  const studentSummaryById = useMemo(() => {
    const map = {};
    packageItems.forEach((item, index) => {
      map[item.studentId] = {
        data: studentSummaryQueries[index]?.data || null,
        isLoading: Boolean(studentSummaryQueries[index]?.isLoading || studentSummaryQueries[index]?.isFetching),
      };
    });
    return map;
  }, [packageItems, studentSummaryQueries]);

  useEffect(() => {
    if (!packageItems.length) return;

    setPackageItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const summary = studentSummaryById[item.studentId]?.data;
        if (!summary) return item;

        const summaryPreviousCampus = summary?.student?.previousCampus;
        const nextPreviousSchoolType = summaryPreviousCampus || item.previousSchoolType;

        const summaryClassroom = summary?.enrollmentStatus?.classroom || null;
        const summaryClassroomLabel =
          summaryClassroom?.displayName ||
          summaryClassroom?.label ||
          summaryClassroom?.name ||
          "";

        const summaryGrade =
          summaryClassroom?.grade ||
          item.grade ||
          "";

        const summaryLevel =
          summaryClassroom?.level ||
          item.level ||
          "";

        const mustDisableAdmissionFee = INTERNAL_SCHOOLS.has(String(summaryPreviousCampus || "").toUpperCase());

        let nextItem = item;

        const summaryHasVacancy = Boolean(
          summaryClassroom?.id ||
          summaryClassroom?._id ||
          summaryClassroom?.classroomId ||
          summaryClassroomLabel
        );

        if (
          summaryClassroomLabel !== item.assignedClassroomLabel ||
          summaryGrade !== item.grade ||
          summaryLevel !== item.level ||
          summaryHasVacancy !== item.hasVacancy
        ) {
          nextItem = {
            ...nextItem,
            assignedClassroomLabel: summaryClassroomLabel,
            grade: summaryGrade,
            level: summaryLevel,
            hasVacancy: summaryHasVacancy,
            requiresClassroomSelection: !summaryHasVacancy,
          };
          changed = true;
        }

        if (nextPreviousSchoolType !== item.previousSchoolType) {
          nextItem = { ...nextItem, previousSchoolType: nextPreviousSchoolType };
          changed = true;
        }

        if (mustDisableAdmissionFee && (item?.admissionFee?.applies || item?.admissionFee?.isExempt)) {
          nextItem = {
            ...nextItem,
            admissionFee: {
              ...item.admissionFee,
              applies: false,
              isExempt: false,
              amount: 0,
            },
          };
          changed = true;
        }

        return nextItem;
      });

      return changed ? next : prev;
    });
  }, [packageItems.length, studentSummaryById]);

  const classroomOptionsByStudent = useMemo(() => {
    const map = {};
    packageItems.forEach((item, index) => {
      const rows = Array.isArray(classroomQueries[index]?.data?.items)
        ? classroomQueries[index].data.items
        : Array.isArray(classroomQueries[index]?.data)
          ? classroomQueries[index].data
          : [];
      map[item.id] = rows;
    });
    return map;
  }, [packageItems, classroomQueries]);

  const createStudentMutation = useMutation({
    mutationFn: createStudentWithPerson,
    onSuccess: async (payload, variables) => {
      const studentId = payload?.id || payload?.student?.id || payload?.studentId;
      if (studentId && selectedFamilyId) {
        await linkStudentToFamily({ familyId: selectedFamilyId, studentId });
      }
      const synthetic = {
        id: studentId,
        person: {
          names: variables.names,
          lastNames: variables.lastNames,
          dni: variables.dni,
        },
      };
      setPackageItems((prev) => [
        ...prev,
        toPackageItemFromStudent(synthetic, {
          isNew: true,
          familyId: selectedFamilyId || null,
          level: variables.level,
          grade: variables.grade || "",
          previousSchoolType: variables.previousSchoolType,
          hasVacancy: true,
          requiresClassroomSelection: false,
          classroom: {
            classroomId: variables.classroomId,
            label: variables.classroomLabel,
          },
        }),
      ]);
      setCreateStudentOpen(false);
    },
  });

  const createStudentWithoutFamilyMutation = useMutation({
    mutationFn: async ({ student, tutor }) => {
      const studentPayload = {
        names: student.names,
        lastNames: student.lastNames,
        dni: student.dni,
        gender: student.gender,
        level: student.level,
        campusCode: student.campusCode,
        previousCampus: student.previousCampus,
        previousSchoolType: student.previousSchoolType,
      };

      const createdStudent = await createStudentWithPerson(studentPayload);
      const studentId = createdStudent?.id || createdStudent?.student?.id || createdStudent?.studentId;
      if (!studentId) throw new Error("No se pudo crear el alumno.");

      const createdFamily = await createFamily({});
      const familyId = createdFamily?.id || createdFamily?.familyId || createdFamily?.family?.id;
      if (!familyId) throw new Error("No se pudo crear la familia.");

      await createTutor({
        ...tutor,
        familyId,
        isPrimary: true,
      });

      await linkStudentToFamily({ familyId, studentId });

      return {
        familyId,
        studentId,
        student,
      };
    },
    onSuccess: (result) => {
      setSelectedFamilyId(result.familyId);
      const synthetic = {
        id: result.studentId,
        person: {
          names: result.student?.names,
          lastNames: result.student?.lastNames,
          dni: result.student?.dni,
        },
      };
      setPackageItems((prev) => [
        ...prev,
        toPackageItemFromStudent(synthetic, {
          isNew: true,
          familyId: result.familyId,
          level: result.student?.level,
          previousSchoolType: result.student?.previousSchoolType,
          hasVacancy: true,
          requiresClassroomSelection: false,
          selectedClassroomId: result.student?.classroomId,
          selectedClassroomLabel: result.student?.classroomLabel,
          classroom: {
            classroomId: result.student?.classroomId,
            label: result.student?.classroomLabel,
          },
        }),
      ]);
      setCreateStudentWithoutFamilyOpen(false);
      setStatusMessage("");
    },
    onError: (error) => {
      setStatusMessage(error?.response?.data?.message || "No se pudo crear alumno y familia.");
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: createQuickEnrollment,
    onSuccess: (payload) => {
      console.log("[NewEnrollment][Draft] saved");
      setEnrollmentId(payload?.id || payload?.enrollment?.id || "");
      setStatusMessage("Borrador guardado correctamente.");
    },
    onError: (error) => setStatusMessage(error?.response?.data?.message || "No se pudo guardar el borrador."),
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, payload }) => confirmEnrollmentById(id, payload),
    onSuccess: () => {
      console.log("[NewEnrollment][Confirm] success");
      setStatusMessage("Matrícula confirmada correctamente.");
      navigate(ROUTES.dashboardEnrollments);
    },
    onError: (error) => setStatusMessage(error?.response?.data?.message || "No se pudo confirmar matrícula."),
  });

  const onSelectIntakeItem = async (item) => {
    console.log("[NewEnrollment][Search] select");
    if (item?.type === "FAMILY") {
      setSelectedFamilyId(item.familyId);
      setQuery("");
      setStatusMessage("");
      return;
    }

    if (item?.cycleStatus === "ENROLLED") {
      setStatusMessage("Alumno ya matriculado en el ciclo activo.");
      return;
    }
    if (item?.activeStatus === "GRADUATED") {
      setStatusMessage("Alumno egresado.");
      return;
    }

    if (item?.familyId && selectedFamilyId && String(item.familyId) !== String(selectedFamilyId)) {
      const useExistingFamily = window.confirm("Este alumno pertenece a otra familia. Aceptar para usar su familia. Cancelar para moverlo a la familia actual.");
      if (useExistingFamily) {
        setSelectedFamilyId(item.familyId);
      } else {
        const reason = window.prompt("Ingrese razón para mover alumno a la familia actual");
        if (!reason?.trim()) {
          setStatusMessage("Se requiere razón para mover alumno.");
          return;
        }
        await linkStudentToFamily({ familyId: selectedFamilyId, studentId: item.studentId, reason: reason.trim() });
      }
    } else if (item?.familyId && !selectedFamilyId) {
      setSelectedFamilyId(item.familyId);
    } else if (!item?.familyId && selectedFamilyId) {
      await linkStudentToFamily({ familyId: selectedFamilyId, studentId: item.studentId });
    } else if (!item?.familyId && !selectedFamilyId) {
      setFamilyModalStudent(item);
      return;
    }

    setPackageItems((prev) => {
      if (prev.some((row) => String(row.studentId) === String(item.studentId))) return prev;
      return [...prev, toPackageItemFromStudent(item, { familyId: selectedFamilyId || item.familyId || null })];
    });
  };

  const handleCreateFamilyForStudent = async (tutorPayload) => {
    try {
      const created = await createFamily({
        studentId: familyModalStudent?.studentId,
        tutor: {
          names: tutorPayload.tutorNames,
          lastNames: tutorPayload.tutorLastNames,
          dni: tutorPayload.tutorDni,
          phone: tutorPayload.tutorPhone,
          isPrimary: true,
        },
      });
      const familyId = created?.id || created?.familyId || created?.family?.id;
      setSelectedFamilyId(familyId);
      await linkStudentToFamily({ familyId, studentId: familyModalStudent?.studentId });
      setPackageItems((prev) => [...prev, toPackageItemFromStudent(familyModalStudent, { familyId })]);
      setFamilyModalStudent(null);
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || "No se pudo crear familia.");
    }
  };

  const handleCreateTutor = async (payload) => {
    const normalizedCodes = studentCodes;
    const studentCod = normalizedCodes[0];

    await createTutorMutation.mutateAsync({
      ...payload,
      familyId: selectedFamilyId,
      studentCod,
      studentCods: normalizedCodes,
      studentsCod: normalizedCodes,
    });
    await familyDetailQuery.refetch();
  };

  const handleEditTutor = async (payload) => {
    const tutorId = getTutorId(selectedTutor);
    const tutorPerson = selectedTutor?.tutorPerson || selectedTutor?.person || {};
    const gender = payload.gender ?? tutorPerson?.gender;

    if (!tutorId) throw new Error("No se pudo identificar el tutor seleccionado");

    await updateTutorMutation.mutateAsync({
      tutorId,
      familyId: selectedFamilyId,
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

    await familyDetailQuery.refetch();
  };

  const hasBlocked = packageItems.some((item) => item.blockedReason);
  const hasMissingClassroom = packageItems.some((item) => item.requiresClassroomSelection && !item.selectedClassroomId);
  const canConfirm = Boolean(selectedFamilyId) && packageItems.length > 0 && !hasBlocked && !hasMissingClassroom && !confirmMutation.isPending;

  const buildPayload = () => ({
    familyId: selectedFamilyId,
    cycleId: activeCycle?.id,
    campus: activeCampus,
    status: "DRAFT",
    enrollmentStudents: packageItems.map((item) => ({
      studentId: item.studentId,
      classroomId: item.selectedClassroomId || undefined,
      admissionFee: {
        applies: Boolean(item?.admissionFee?.applies),
        isExempt: Boolean(item?.admissionFee?.isExempt),
        amount: Number(item?.admissionFee?.amount || 0),
        reason: item?.admissionFee?.reason || undefined,
      },
      enrollmentFee: {
        isExempt: Boolean(item?.enrollmentFee?.isExempt),
        amount: Number(item?.enrollmentFee?.amount || 0),
        reason: item?.enrollmentFee?.reason || undefined,
      },
      pensionMonthlyAmounts: Array.isArray(item?.pensionMonthlyAmounts) ? item.pensionMonthlyAmounts.map((value) => Number(value || 0)) : buildPensionArrayFromGeneralAmount(0, 0),
      previousSchoolType: item.previousSchoolType,
    })),
    paymentAgreement: {
      notes: payments.notes || undefined,
      months: ENROLLMENT_CASE_MONTHS,
    },
  });

  const handleSaveDraft = async () => {
    setStatusMessage("");
    await saveDraftMutation.mutateAsync(buildPayload());
  };

  const handleConfirm = async () => {
    if (!canConfirm) {
      setStatusMessage("Completa familia, alumnos elegibles y aulas pendientes antes de confirmar.");
      return;
    }

    const payload = buildPayload();

    let id = enrollmentId;
    if (!id) {
      const created = await saveDraftMutation.mutateAsync(payload);
      id = created?.id || created?.enrollment?.id;
      setEnrollmentId(id || "");
    }

    if (!id) {
      setStatusMessage("No se pudo determinar el borrador para confirmar.");
      return;
    }

    await confirmMutation.mutateAsync({ id, payload });
  };

  return (
    <div className="grid grid-cols-1 gap-4 pb-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-4">
        <Card className="border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm text-gray-600">Campus activo: <span className="font-medium">{activeCampus || "-"}</span> · Ciclo activo: <span className="font-medium">{activeCycle?.name || "No disponible"}</span></p>
              <p className="text-xs text-gray-500">Estado: Borrador</p>
            </div>
            <SecondaryButton onClick={() => navigate(ROUTES.dashboardEnrollments)}>Volver</SecondaryButton>
          </div>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <IntakeSearchBar
            value={query}
            onChange={setQuery}
            results={intakeResults}
            isLoading={intakeSearchQuery.isFetching}
            onSelect={onSelectIntakeItem}
          />
          {statusMessage ? <p className="mt-2 text-sm text-amber-700">{statusMessage}</p> : null}
        </Card>

        <FamilySummaryCard
          family={familyData}
          tutors={tutors}
          onEditTutor={(tutor) => {
            setSelectedTutor(tutor);
            setEditTutorModalOpen(true);
          }}
          onAddTutor={() => setCreateTutorOpen(true)}
        />

        <EnrollmentPackageList
          items={packageItems}
          classroomOptionsByStudent={classroomOptionsByStudent}
          onRemove={(itemId) => setPackageItems((prev) => prev.filter((row) => row.id !== itemId))}
          onCreateStudent={() => {
            if (selectedFamilyId) {
              setCreateStudentOpen(true);
              return;
            }
            setCreateStudentWithoutFamilyOpen(true);
          }}
          onSearchStudent={() => setSearchStudentOpen(true)}
          onChooseClassroom={(itemId, classroomId, classroom) => {
            setPackageItems((prev) => prev.map((row) => (row.id === itemId ? {
              ...row,
              selectedClassroomId: classroomId,
              selectedClassroomLabel: classroom?.label || classroom?.name || "",
            } : row)));
          }}
          onChangeCosts={(itemId, patch) => setPackageItems((prev) => prev.map((row) => (row.id === itemId ? { ...row, ...patch } : row)))}
          studentSummaryById={studentSummaryById}
        />
      </section>

      <RightSummarySidebar
        family={familyData}
        items={packageItems}
        payments={payments}
        onPaymentsChange={(patch) => setPayments((prev) => ({ ...prev, ...patch }))}
        onSaveDraft={handleSaveDraft}
        onConfirm={handleConfirm}
        isSaving={saveDraftMutation.isPending}
        isConfirming={confirmMutation.isPending}
      />

      <CreateStudentModal
        open={createStudentOpen}
        onClose={() => setCreateStudentOpen(false)}
        onSubmit={(payload) => createStudentMutation.mutateAsync(payload)}
        isSubmitting={createStudentMutation.isPending}
        defaultCampus={activeCampus || ""}
      />

      <CreateFamilyFromStudentModal
        open={Boolean(familyModalStudent)}
        onClose={() => setFamilyModalStudent(null)}
        student={familyModalStudent}
        onSubmit={handleCreateFamilyForStudent}
      />

      <SearchUnassignedStudentModal
        open={searchStudentOpen}
        onClose={() => setSearchStudentOpen(false)}
        onSelect={(item) => onSelectIntakeItem({ ...item, type: "STUDENT" })}
      />

      <CreateStudentWithoutFamilyWizardModal
        open={createStudentWithoutFamilyOpen}
        onClose={() => setCreateStudentWithoutFamilyOpen(false)}
        onSubmit={(payload) => createStudentWithoutFamilyMutation.mutateAsync(payload)}
        isSubmitting={createStudentWithoutFamilyMutation.isPending}
        defaultCampus={activeCampus || ""}
      />

      <CreateTutorModal
        open={createTutorOpen}
        onClose={() => setCreateTutorOpen(false)}
        onCreate={handleCreateTutor}
        endpointReady
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
    </div>
  );
}
