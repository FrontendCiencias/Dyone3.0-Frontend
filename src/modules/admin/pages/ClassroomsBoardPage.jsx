import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { useCampusesQuery } from "../hooks/useCampusesQuery";
import { useClassroomBoardQuery } from "../hooks/useClassroomBoardQuery";
import { changeStudentClassroom } from "../../students/services/students.service";
import { CAPABILITIES, hasCapability } from "../../auth/utils/capabilities";
import {
  createClassroomRosterPrintStorageKey,
  saveClassroomRosterPrintPayload,
} from "../utils/classroomRosterPrintStorage";

const LEVEL_OPTIONS = [
  { value: "INITIAL", label: "Inicial" },
  { value: "PRIMARY", label: "Primaria" },
  { value: "SECONDARY", label: "Secundaria" },
];

const GRADE_OPTIONS_BY_LEVEL = {
  INITIAL: [3, 4, 5],
  PRIMARY: [1, 2, 3, 4, 5, 6],
  SECONDARY: [1, 2, 3, 4, 5],
};

function formatStudentName(student) {
  return [student?.lastNames, student?.names].filter(Boolean).join(", ") || "Alumno";
}

function formatStatus(value) {
  if (value === "ENROLLED") return "Matriculado";
  if (value === "ABSENT") return "Ausente";
  if (value === "TRANSFERRED") return "Trasladado";
  return value || "-";
}

function getCampusOptions(data) {
  return Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
}

function getErrorMessage(error, fallback = "No se pudo completar la operacion.") {
  const message = error?.response?.data?.message || error?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return fallback;
}

function toPrintableClassroomPayload({ classroom, board }) {
  return {
    classroomId: classroom.classroomId,
    label: classroom.label,
    section: classroom.section || null,
    grade: classroom.grade || null,
    level: classroom.level || board?.level || null,
    campusCode: board?.campus?.code || null,
    campusName: board?.campus?.name || board?.campus?.code || null,
    students: Array.isArray(classroom.students) ? classroom.students : [],
  };
}

export default function ClassroomsBoardPage() {
  const queryClient = useQueryClient();
  const { activeCampus, activeRole, roles } = useAuth();
  const role = activeRole || roles?.[0] || "";
  const canMoveStudents = hasCapability(role, CAPABILITIES.studentsChangeClassroom);
  const campusesQuery = useCampusesQuery();
  const campuses = useMemo(() => getCampusOptions(campusesQuery.data), [campusesQuery.data]);

  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("SECONDARY");
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [moveTargets, setMoveTargets] = useState({});
  const [selectedClassroomIds, setSelectedClassroomIds] = useState(() => new Set());
  const [printError, setPrintError] = useState("");

  useEffect(() => {
    if (selectedCampus) return;
    if (activeCampus && activeCampus !== "ALL") {
      setSelectedCampus(activeCampus);
      return;
    }
    const firstCampus = campuses[0];
    if (firstCampus?.code) setSelectedCampus(firstCampus.code);
  }, [activeCampus, campuses, selectedCampus]);

  useEffect(() => {
    const gradeOptions = GRADE_OPTIONS_BY_LEVEL[selectedLevel] || [];
    if (!gradeOptions.includes(Number(selectedGrade))) {
      setSelectedGrade(gradeOptions[0] || 1);
    }
  }, [selectedLevel, selectedGrade]);

  const boardQuery = useClassroomBoardQuery({
    campus: selectedCampus,
    level: selectedLevel,
    grade: selectedGrade,
  });

  const board = boardQuery.data || null;
  const columns = useMemo(
    () => (Array.isArray(boardQuery.data?.columns) ? boardQuery.data.columns : []),
    [boardQuery.data?.columns],
  );
  const cycleId = board?.cycleId || null;
  const totalStudents = board?.totals?.students || 0;
  const gradeOptions = GRADE_OPTIONS_BY_LEVEL[selectedLevel] || [];
  const visibleClassroomIds = useMemo(() => columns.map((column) => column.classroomId), [columns]);
  const allVisibleSelected = visibleClassroomIds.length > 0 && visibleClassroomIds.every((classroomId) => selectedClassroomIds.has(classroomId));

  useEffect(() => {
    setSelectedClassroomIds((prev) => {
      const next = new Set();
      visibleClassroomIds.forEach((classroomId) => {
        if (prev.has(classroomId)) next.add(classroomId);
      });
      if (next.size === prev.size && [...next].every((classroomId) => prev.has(classroomId))) {
        return prev;
      }
      return next;
    });
  }, [visibleClassroomIds]);

  const moveMutation = useMutation({
    mutationFn: ({ studentId, classroomId }) => changeStudentClassroom(studentId, {
      classroomId,
      cycleId,
      reason: "Reorganizacion global de secciones",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroom-board", selectedCampus, selectedLevel, selectedGrade] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const handleMoveStudent = async (studentId) => {
    const targetClassroomId = moveTargets[studentId];
    if (!targetClassroomId || !cycleId) return;

    await moveMutation.mutateAsync({ studentId, classroomId: targetClassroomId });
    setMoveTargets((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const handleToggleClassroom = (classroomId) => {
    setSelectedClassroomIds((prev) => {
      const next = new Set(prev);
      if (next.has(classroomId)) next.delete(classroomId);
      else next.add(classroomId);
      return next;
    });
  };

  const handleToggleAllVisible = () => {
    setSelectedClassroomIds((prev) => {
      if (allVisibleSelected) return new Set();
      return new Set(visibleClassroomIds);
    });
  };

  const handlePrintSelected = () => {
    setPrintError("");

    const selectedColumns = columns.filter((column) => selectedClassroomIds.has(column.classroomId));
    if (!selectedColumns.length) return;

    let blockedCount = 0;

    selectedColumns.forEach((column) => {
      const printKey = createClassroomRosterPrintStorageKey();
      saveClassroomRosterPrintPayload(printKey, {
        generatedAt: new Date().toISOString(),
        items: [toPrintableClassroomPayload({ classroom: column, board })],
      });

      const previewUrl = `${ROUTES.dashboardClassroomsPrintPreview}?printKey=${encodeURIComponent(printKey)}`;
      const openedWindow = window.open(previewUrl, "_blank", "noopener,noreferrer");
      if (!openedWindow) blockedCount += 1;
    });

    if (blockedCount > 0) {
      setPrintError("Tu navegador bloqueo una o mas pestanas de impresion. Permite ventanas emergentes para generar todas las listas.");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Salones por grado</h2>
            <p className="mt-1 text-sm text-gray-500">
              {canMoveStudents
                ? "Revisa todas las secciones de un grado, mueve alumnos y genera listas imprimibles por salon."
                : "Revisa todas las secciones de un grado y genera listas imprimibles por salon."}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sede</label>
              <select
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm"
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
              >
                {campuses.map((campus) => (
                  <option key={campus._id || campus.code} value={campus.code}>
                    {campus.name || campus.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nivel</label>
              <select
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Grado</label>
              <select
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value))}
              >
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-gray-600">
            <strong className="text-gray-900">{columns.length}</strong> seccion(es) visibles - {" "}
            <strong className="text-gray-900">{totalStudents}</strong> alumno(s) - {" "}
            <strong className="text-gray-900">{selectedClassroomIds.size}</strong> salon(es) seleccionado(s)
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <SecondaryButton onClick={handleToggleAllVisible} disabled={!visibleClassroomIds.length}>
              {allVisibleSelected ? "Limpiar visibles" : "Seleccionar visibles"}
            </SecondaryButton>
            <Button onClick={handlePrintSelected} disabled={!selectedClassroomIds.size}>
              Imprimir listas
            </Button>
          </div>
        </div>

        {printError ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {printError}
          </div>
        ) : null}

        {canMoveStudents && moveMutation.isError ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {getErrorMessage(moveMutation.error, "No se pudo mover el alumno.")}
          </div>
        ) : null}

        {boardQuery.isLoading || campusesQuery.isLoading ? (
          <div className="py-8 text-sm text-gray-500">Cargando salones...</div>
        ) : boardQuery.isError ? (
          <div className="py-8 text-sm text-red-700">
            {getErrorMessage(boardQuery.error, "No se pudo cargar la vista global de salones.")}
          </div>
        ) : !columns.length ? (
          <div className="py-8 text-sm text-gray-500">
            No hay secciones disponibles para el filtro seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto pt-4">
            <div className="flex min-w-max gap-4 xl:min-w-0">
              {columns.map((column) => {
                const destinationOptions = columns.filter((row) => row.classroomId !== column.classroomId);
                const isSelected = selectedClassroomIds.has(column.classroomId);

                return (
                  <div
                    key={column.classroomId}
                    className={[
                      "flex w-[340px] shrink-0 flex-col rounded-2xl border bg-gray-50 xl:w-[calc((100%-2rem)/3)]",
                      isSelected ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-200",
                    ].join(" ")}
                  >
                    <div className="border-b border-gray-200 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleClassroom(column.classroomId)}
                              aria-label={`Seleccionar ${column.label}`}
                            />
                            <h3 className="text-sm font-semibold text-gray-900">{column.label}</h3>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {column.studentsCount} alumno(s)
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600">
                          Seccion {column.section}
                        </span>
                      </div>
                    </div>

                    <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto p-3">
                      {column.students.length ? column.students.map((student) => {
                        const studentId = student.studentId;
                        const isPending = moveMutation.isPending && moveMutation.variables?.studentId === studentId;

                        return (
                          <div key={studentId} className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900">{formatStudentName(student)}</p>
                                <p className="mt-1 truncate text-xs text-gray-500">
                                  {student.internalCode || "-"} - {student.dni || "-"}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
                                {formatStatus(student.enrollmentStatus)}
                              </span>
                            </div>

                            {canMoveStudents ? (
                              <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                                <select
                                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
                                  value={moveTargets[studentId] || ""}
                                  onChange={(e) => setMoveTargets((prev) => ({ ...prev, [studentId]: e.target.value }))}
                                >
                                  <option value="">Mover a...</option>
                                  {destinationOptions.map((option) => (
                                    <option key={option.classroomId} value={option.classroomId}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>

                                <div className="flex justify-end">
                                  <Button
                                    onClick={() => handleMoveStudent(studentId)}
                                    disabled={!moveTargets[studentId] || isPending || !cycleId}
                                  >
                                    {isPending ? "Moviendo..." : "Mover"}
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      }) : (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                          Sin alumnos en esta seccion.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
