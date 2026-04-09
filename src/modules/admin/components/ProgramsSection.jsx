import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../../lib/auth";
import { searchStudents } from "../../students/services/students.service";
import { useCampusesQuery } from "../hooks/useCampusesQuery";
import { useClassroomsQuery } from "../hooks/useClassroomsQuery";
import { useCyclesQuery } from "../hooks/useCyclesQuery";
import {
  addProgramStudent,
  createProgram,
  getProgramDetail,
  getPrograms,
} from "../services/admin.service";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "YAPE", label: "Yape" },
  { value: "TRANSFER", label: "Transferencia" },
];

function getErrorMessage(error, fallback) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return fallback;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function ProgramsSection({ canAccess }) {
  const queryClient = useQueryClient();
  const { activeCampus } = useAuth();
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [programForm, setProgramForm] = useState({ name: "", notes: "" });
  const [programError, setProgramError] = useState("");

  const [existingSearch, setExistingSearch] = useState("");
  const [selectedExistingStudent, setSelectedExistingStudent] = useState(null);
  const [existingPayment, setExistingPayment] = useState({
    paymentAmount: "",
    paymentMethod: "CASH",
    paymentDate: todayInputValue(),
    notes: "",
  });
  const [existingError, setExistingError] = useState("");
  const [submissionTarget, setSubmissionTarget] = useState("");

  const [newStudentForm, setNewStudentForm] = useState({
    names: "",
    lastNames: "",
    campusId: "",
    grade: "",
    classroomId: "",
    paymentAmount: "",
    paymentMethod: "CASH",
    paymentDate: todayInputValue(),
    notes: "",
  });
  const [newStudentError, setNewStudentError] = useState("");

  const campusesQuery = useCampusesQuery();
  const cyclesQuery = useCyclesQuery();
  const classroomsQuery = useClassroomsQuery();

  const programsQuery = useQuery({
    queryKey: ["admin", "programs"],
    queryFn: getPrograms,
    enabled: canAccess,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const programs = Array.isArray(programsQuery.data?.items) ? programsQuery.data.items : [];

  useEffect(() => {
    if (!selectedProgramId && programs.length) {
      setSelectedProgramId(programs[0].id);
    }
  }, [programs, selectedProgramId]);

  const selectedProgram = programs.find((program) => program.id === selectedProgramId) || null;

  const programDetailQuery = useQuery({
    queryKey: ["admin", "programs", "detail", selectedProgramId],
    queryFn: () => getProgramDetail(selectedProgramId),
    enabled: canAccess && Boolean(selectedProgramId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const studentSearchQuery = useQuery({
    queryKey: ["admin", "programs", "students-search", existingSearch],
    queryFn: () => searchStudents({ q: existingSearch, limit: 8 }),
    enabled: canAccess && String(existingSearch || "").trim().length >= 2,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const createProgramMutation = useMutation({
    mutationFn: createProgram,
    onSuccess: async () => {
      setProgramForm({ name: "", notes: "" });
      setProgramError("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
    },
    onError: (error) => setProgramError(getErrorMessage(error, "No se pudo crear el programa")),
  });

  const addProgramStudentMutation = useMutation({
    mutationFn: ({ programId, payload }) => addProgramStudent(programId, payload),
    onSuccess: async () => {
      setExistingSearch("");
      setSelectedExistingStudent(null);
      setExistingPayment({ paymentAmount: "", paymentMethod: "CASH", paymentDate: todayInputValue(), notes: "" });
      setExistingError("");
      setNewStudentForm({
        names: "",
        lastNames: "",
        campusId: "",
        grade: "",
        classroomId: "",
        paymentAmount: "",
        paymentMethod: "CASH",
        paymentDate: todayInputValue(),
        notes: "",
      });
      setNewStudentError("");
      setSubmissionTarget("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "programs", "detail", selectedProgramId] });
    },
    onError: (error) => {
      const message = getErrorMessage(error, "No se pudo agregar el alumno al programa");
      if (submissionTarget === "existing") {
        setExistingError(message);
      }
      if (submissionTarget === "new") {
        setNewStudentError(message);
      }
    },
  });

  const campusItems = Array.isArray(campusesQuery.data) ? campusesQuery.data : [];
  const cycleItems = Array.isArray(cyclesQuery.data) ? cyclesQuery.data : [];
  const classroomItems = Array.isArray(classroomsQuery.data) ? classroomsQuery.data : [];

  const defaultCampus = useMemo(() => {
    return campusItems.find((campus) => campus.code === activeCampus) || campusItems[0] || null;
  }, [campusItems, activeCampus]);

  const activeCycle = useMemo(() => {
    return cycleItems.find((cycle) => cycle.isActive) || cycleItems[0] || null;
  }, [cycleItems]);

  const existingSearchItems = Array.isArray(studentSearchQuery.data?.items) ? studentSearchQuery.data.items : [];

  const campusClassrooms = useMemo(() => {
    return classroomItems.filter((classroom) => {
      const campusId = classroom?.campusId?._id || classroom?.campusId;
      return String(campusId || "") === String(newStudentForm.campusId || "");
    });
  }, [classroomItems, newStudentForm.campusId]);

  const gradeOptions = useMemo(() => {
    return [...new Set(campusClassrooms.map((classroom) => String(classroom.grade || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  }, [campusClassrooms]);

  const classroomOptions = useMemo(() => {
    return campusClassrooms
      .filter((classroom) => String(classroom.grade || "").trim() === String(newStudentForm.grade || "").trim())
      .map((classroom) => ({
        id: classroom._id,
        label: classroom.displayName || `${classroom.level} ${classroom.grade}-${classroom.section}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [campusClassrooms, newStudentForm.grade]);

  function handleCreateProgram() {
    if (!programForm.name.trim()) {
      setProgramError("Ingresa un nombre para el programa.");
      return;
    }

    if (!defaultCampus?._id || !activeCycle?._id) {
      setProgramError("Falta un campus o ciclo activo para crear el programa.");
      return;
    }

    createProgramMutation.mutate({
      name: programForm.name.trim(),
      notes: programForm.notes.trim(),
      campusId: defaultCampus._id,
      cycleId: activeCycle._id,
    });
  }

  function handleAddExistingStudent() {
    if (!selectedProgramId) {
      setExistingError("Selecciona primero un programa.");
      return;
    }
    if (!selectedExistingStudent?.id) {
      setExistingError("Selecciona un alumno existente.");
      return;
    }
    if (!existingPayment.paymentAmount) {
      setExistingError("Ingresa el monto pagado.");
      return;
    }

    setExistingError("");
    setSubmissionTarget("existing");
    addProgramStudentMutation.mutate({
      programId: selectedProgramId,
      payload: {
        existingStudentId: selectedExistingStudent.id,
        paymentAmount: Number(existingPayment.paymentAmount || 0),
        paymentMethod: existingPayment.paymentMethod,
        paymentDate: existingPayment.paymentDate,
        notes: existingPayment.notes.trim(),
      },
    });
  }

  function handleAddNewStudent() {
    if (!selectedProgramId) {
      setNewStudentError("Selecciona primero un programa.");
      return;
    }
    if (!newStudentForm.names.trim() || !newStudentForm.lastNames.trim()) {
      setNewStudentError("Completa apellidos y nombres del alumno.");
      return;
    }
    if (!newStudentForm.campusId || !newStudentForm.grade || !newStudentForm.classroomId) {
      setNewStudentError("Selecciona campus, grado y salón.");
      return;
    }
    if (!newStudentForm.paymentAmount) {
      setNewStudentError("Ingresa el monto pagado.");
      return;
    }

    setNewStudentError("");
    setSubmissionTarget("new");
    addProgramStudentMutation.mutate({
      programId: selectedProgramId,
      payload: {
        newStudent: {
          names: newStudentForm.names.trim(),
          lastNames: newStudentForm.lastNames.trim(),
          classroomId: newStudentForm.classroomId,
        },
        paymentAmount: Number(newStudentForm.paymentAmount || 0),
        paymentMethod: newStudentForm.paymentMethod,
        paymentDate: newStudentForm.paymentDate,
        notes: newStudentForm.notes.trim(),
      },
    });
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Programas</h2>
          <p className="mt-1 text-sm text-gray-600">
            Módulo temporal para registrar programas y pagos independientes del flujo académico regular.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">Crear programa</p>
              <div className="mt-3 space-y-3">
                <Input
                  label="Nombre"
                  value={programForm.name}
                  onChange={(e) => {
                    setProgramForm((prev) => ({ ...prev, name: e.target.value }));
                    setProgramError("");
                  }}
                  placeholder="Ej: Programa de reforzamiento"
                />
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-gray-700">Notas</label>
                  <textarea
                    value={programForm.notes}
                    onChange={(e) => {
                      setProgramForm((prev) => ({ ...prev, notes: e.target.value }));
                      setProgramError("");
                    }}
                    rows={3}
                    className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                    placeholder="Notas del programa"
                  />
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  Se creará bajo el campus {defaultCampus?.name || defaultCampus?.code || "-"} y el ciclo {activeCycle?.name || "-"}.
                </div>
                {programError ? <p className="text-sm text-red-600">{programError}</p> : null}
                <Button className="w-full" onClick={handleCreateProgram} disabled={!canAccess || createProgramMutation.isPending}>
                  Crear programa
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">Programas registrados</p>
              <div className="mt-3 space-y-2">
                {programs.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    onClick={() => setSelectedProgramId(program.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${selectedProgramId === program.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <p className="font-medium text-gray-900">{program.name}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {program.campus?.name || program.campus?.code || "-"} · {program.cycle?.name || "-"} · {program.studentsCount} alumno(s)
                    </p>
                  </button>
                ))}
                {!programs.length ? <p className="text-sm text-gray-500">Todavía no hay programas creados.</p> : null}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {selectedProgram ? `Programa: ${selectedProgram.name}` : "Selecciona un programa"}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {selectedProgram
                  ? `${selectedProgram.campus?.name || selectedProgram.campus?.code || "-"} · ${selectedProgram.cycle?.name || "-"}`
                  : "Primero crea o selecciona un programa para empezar a cargar alumnos."}
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900">Agregar alumno existente</p>
                <div className="mt-3 space-y-3">
                  <Input
                    label="Buscar alumno"
                    value={existingSearch}
                    onChange={(e) => {
                      setExistingSearch(e.target.value);
                      setExistingError("");
                    }}
                    placeholder="Nombre, DNI o código"
                  />

                  {existingSearch.trim().length >= 2 ? (
                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-2">
                      {existingSearchItems.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setSelectedExistingStudent(student)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${selectedExistingStudent?.id === student.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
                        >
                          <p className="font-medium text-gray-900">{student.lastNames}, {student.names}</p>
                          <p className="text-xs text-gray-600">
                            DNI: {student.dni || "-"} · Campus: {student.campusCode || "-"} · Aula: {student.classroomName || "-"}
                          </p>
                        </button>
                      ))}
                      {!existingSearchItems.length && !studentSearchQuery.isFetching ? (
                        <p className="text-sm text-gray-500">No se encontraron alumnos.</p>
                      ) : null}
                    </div>
                  ) : null}

                  <Input
                    label="Monto pagado"
                    type="number"
                    min="0"
                    step="0.01"
                    value={existingPayment.paymentAmount}
                    onChange={(e) => setExistingPayment((prev) => ({ ...prev, paymentAmount: e.target.value }))}
                    placeholder="0.00"
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-medium text-gray-700">Método de pago</label>
                      <select
                        className="rounded border px-3 py-2 text-sm"
                        value={existingPayment.paymentMethod}
                        onChange={(e) => setExistingPayment((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                      >
                        {PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </div>
                    <Input
                      label="Fecha de pago"
                      type="date"
                      value={existingPayment.paymentDate}
                      onChange={(e) => setExistingPayment((prev) => ({ ...prev, paymentDate: e.target.value }))}
                    />
                  </div>
                  <Input
                    label="Nota"
                    value={existingPayment.notes}
                    onChange={(e) => setExistingPayment((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observación opcional"
                  />
                  {existingError ? <p className="text-sm text-red-600">{existingError}</p> : null}
                  <Button className="w-full" onClick={handleAddExistingStudent} disabled={addProgramStudentMutation.isPending || !selectedProgramId}>
                    Agregar al programa
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900">Agregar alumno nuevo</p>
                <div className="mt-3 space-y-3">
                  <Input
                    label="Apellidos"
                    value={newStudentForm.lastNames}
                    onChange={(e) => setNewStudentForm((prev) => ({ ...prev, lastNames: e.target.value }))}
                  />
                  <Input
                    label="Nombres"
                    value={newStudentForm.names}
                    onChange={(e) => setNewStudentForm((prev) => ({ ...prev, names: e.target.value }))}
                  />
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-medium text-gray-700">Campus</label>
                      <select
                        className="rounded border px-3 py-2 text-sm"
                        value={newStudentForm.campusId}
                        onChange={(e) => setNewStudentForm((prev) => ({ ...prev, campusId: e.target.value, grade: "", classroomId: "" }))}
                      >
                        <option value="">Selecciona</option>
                        {campusItems.map((campus) => <option key={campus._id} value={campus._id}>{campus.name || campus.code}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-medium text-gray-700">Grado</label>
                      <select
                        className="rounded border px-3 py-2 text-sm"
                        value={newStudentForm.grade}
                        onChange={(e) => setNewStudentForm((prev) => ({ ...prev, grade: e.target.value, classroomId: "" }))}
                      >
                        <option value="">Selecciona</option>
                        {gradeOptions.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-medium text-gray-700">Salón</label>
                      <select
                        className="rounded border px-3 py-2 text-sm"
                        value={newStudentForm.classroomId}
                        onChange={(e) => setNewStudentForm((prev) => ({ ...prev, classroomId: e.target.value }))}
                      >
                        <option value="">Selecciona</option>
                        {classroomOptions.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Monto pagado"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newStudentForm.paymentAmount}
                    onChange={(e) => setNewStudentForm((prev) => ({ ...prev, paymentAmount: e.target.value }))}
                    placeholder="0.00"
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-medium text-gray-700">Método de pago</label>
                      <select
                        className="rounded border px-3 py-2 text-sm"
                        value={newStudentForm.paymentMethod}
                        onChange={(e) => setNewStudentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                      >
                        {PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </div>
                    <Input
                      label="Fecha de pago"
                      type="date"
                      value={newStudentForm.paymentDate}
                      onChange={(e) => setNewStudentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                    />
                  </div>
                  <Input
                    label="Nota"
                    value={newStudentForm.notes}
                    onChange={(e) => setNewStudentForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observación opcional"
                  />
                  {newStudentError ? <p className="text-sm text-red-600">{newStudentError}</p> : null}
                  <Button className="w-full" onClick={handleAddNewStudent} disabled={addProgramStudentMutation.isPending || !selectedProgramId}>
                    Crear y agregar al programa
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">Alumnos del programa</p>
                {programDetailQuery.isFetching ? <span className="text-xs text-gray-500">Actualizando...</span> : null}
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-3 py-2 font-medium">Alumno</th>
                      <th className="px-3 py-2 font-medium">Campus</th>
                      <th className="px-3 py-2 font-medium">Salón</th>
                      <th className="px-3 py-2 font-medium">Pago</th>
                      <th className="px-3 py-2 font-medium">Método</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(programDetailQuery.data?.students || []).map((row) => (
                      <tr key={row.programEnrollmentId}>
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-900">{row.student?.fullName || "Alumno"}</p>
                          <p className="text-xs text-gray-500">DNI: {row.student?.dni || "-"} · Código: {row.student?.internalCode || "-"}</p>
                        </td>
                        <td className="px-3 py-3 text-gray-700">{row.campus?.name || row.campus?.code || "-"}</td>
                        <td className="px-3 py-3 text-gray-700">{row.classroom?.displayName || "-"}</td>
                        <td className="px-3 py-3 text-gray-700">S/ {Number(row.payment?.amount || 0).toFixed(2)}</td>
                        <td className="px-3 py-3 text-gray-700">{PAYMENT_METHODS.find((item) => item.value === row.payment?.method)?.label || row.payment?.method || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!programDetailQuery.data?.students?.length ? (
                  <p className="px-3 py-4 text-sm text-gray-500">Todavía no hay alumnos cargados en este programa.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
