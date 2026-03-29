import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import BaseModal from "../../../shared/ui/BaseModal";
import { ROUTES } from "../../../config/routes";
import { searchStudents } from "../../students/services/students.service";
import { useClassroomsQuery } from "../hooks/useClassroomsQuery";
import {
  addProgramStudent,
  getProgramSessionDetail,
  saveProgramSessionEntry,
} from "../services/admin.service";

const RECEIVERS = ["Juan Carlos", "Juan Manuel", "Maricarmen", "Diego", "Angie"];
const PAYMENT_METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "YAPE", label: "Yape" },
  { value: "TRANSFER", label: "Transferencia" },
];
const OTHER_CAMPUS_VALUE = "OTHER_SCHOOL";
const EXTERNAL_GRADE_OPTIONS = [
  "3ro de Primaria",
  "4to de Primaria",
  "5to de Primaria",
  "6to de Primaria",
  "1ro de Secundaria",
  "2do de Secundaria",
  "3ro de Secundaria",
  "4to de Secundaria",
  "5to de Secundaria",
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

function createInitialExistingForm() {
  return {
    open: false,
    student: null,
    attended: true,
    registerPayment: false,
    paymentAmount: "",
    paymentMethod: "CASH",
    receivedBy: "",
    notes: "",
  };
}

function createInitialNewForm() {
  return {
    open: false,
    names: "",
    lastNames: "",
    campusId: "",
    grade: "",
    classroomId: "",
    attended: true,
    registerPayment: false,
    paymentAmount: "",
    paymentMethod: "CASH",
    receivedBy: "",
    notes: "",
    otherSchoolName: "",
  };
}

function createInitialPaymentModal() {
  return {
    open: false,
    row: null,
    paymentAmount: "",
    paymentMethod: "CASH",
    receivedBy: "",
    notes: "",
  };
}

function toSearchableText(row) {
  return [
    row.student?.fullName,
    row.student?.dni,
    row.student?.internalCode,
    row.campus?.name,
    row.classroom?.displayName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildCampusOptions(classrooms) {
  const map = new Map();
  classrooms.forEach((classroom) => {
    const campus = classroom?.campusId || null;
    const id = campus?._id || campus?.id || null;
    if (!id || map.has(String(id))) return;
    map.set(String(id), {
      id: String(id),
      code: campus?.code || null,
      name: campus?.name || campus?.code || "Campus",
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function getStudentResultId(item) {
  return item?.id || item?._id || null;
}

export default function ProgramSessionDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { programId, sessionId } = useParams();

  const [tableSearch, setTableSearch] = useState("");
  const [existingSearch, setExistingSearch] = useState("");
  const [attendanceDrafts, setAttendanceDrafts] = useState({});
  const [existingForm, setExistingForm] = useState(createInitialExistingForm());
  const [newForm, setNewForm] = useState(createInitialNewForm());
  const [paymentModal, setPaymentModal] = useState(createInitialPaymentModal());
  const [existingError, setExistingError] = useState("");
  const [newError, setNewError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [attendanceErrorByRow, setAttendanceErrorByRow] = useState({});

  const detailQuery = useQuery({
    queryKey: ["admin", "programs", "session-detail", programId, sessionId],
    queryFn: () => getProgramSessionDetail(programId, sessionId),
    enabled: Boolean(programId) && Boolean(sessionId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const existingSearchQuery = useQuery({
    queryKey: ["admin", "programs", "session-detail", "students-search", existingSearch],
    queryFn: () => searchStudents({ q: existingSearch, limit: 8 }),
    enabled: String(existingSearch || "").trim().length >= 2,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const classroomsQuery = useClassroomsQuery();

  const saveEntryMutation = useMutation({
    mutationFn: ({ _source, ...payload }) => saveProgramSessionEntry(programId, sessionId, payload),
    onSuccess: async () => {
      setPaymentModal(createInitialPaymentModal());
      setPaymentError("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "programs", "session-detail", programId, sessionId] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "programs", "detail", programId] });
    },
    onError: (mutationError, variables) => {
      const message = getErrorMessage(mutationError, "No se pudo guardar el registro de la sesión");
      if (variables?._source === "attendance") {
        setAttendanceErrorByRow((prev) => ({ ...prev, [variables.programEnrollmentId]: message }));
        return;
      }
      setPaymentError(message);
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: ({ _source, payload }) => addProgramStudent(programId, payload),
    onSuccess: async () => {
      setExistingForm(createInitialExistingForm());
      setNewForm(createInitialNewForm());
      setExistingSearch("");
      setExistingError("");
      setNewError("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "programs", "session-detail", programId, sessionId] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "programs", "detail", programId] });
    },
    onError: (mutationError, variables) => {
      const message = getErrorMessage(mutationError, "No se pudo matricular al alumno en el programa");
      if (variables?._source === "existing") {
        setExistingError(message);
        return;
      }
      setNewError(message);
    },
  });

  const detail = detailQuery.data;
  const students = Array.isArray(detail?.students) ? detail.students : [];
  const existingSearchItems = Array.isArray(existingSearchQuery.data?.items) ? existingSearchQuery.data.items : [];
  const classroomItems = Array.isArray(classroomsQuery.data) ? classroomsQuery.data : [];

  useEffect(() => {
    const next = {};
    students.forEach((row) => {
      next[row.programEnrollmentId] = row.sessionEntry?.attended ?? false;
    });
    setAttendanceDrafts(next);
    setAttendanceErrorByRow({});
  }, [students]);

  const enrolledStudentIds = useMemo(() => new Set(students.map((row) => String(row.studentId))), [students]);

  const availableSearchItems = useMemo(() => {
    return existingSearchItems.filter((item) => !enrolledStudentIds.has(String(getStudentResultId(item) || "")));
  }, [existingSearchItems, enrolledStudentIds]);

  const filteredStudents = useMemo(() => {
    const term = String(tableSearch || "").trim().toLowerCase();
    if (!term) return students;
    return students.filter((row) => toSearchableText(row).includes(term));
  }, [students, tableSearch]);

  const campusOptions = useMemo(() => buildCampusOptions(classroomItems), [classroomItems]);
  const campusSelectorOptions = useMemo(() => (
    [...campusOptions, { id: OTHER_CAMPUS_VALUE, code: "OTHER", name: "Otro colegio" }]
  ), [campusOptions]);
  const isExternalNewStudent = newForm.campusId === OTHER_CAMPUS_VALUE;

  const newCampusClassrooms = useMemo(() => {
    if (isExternalNewStudent) return [];
    return classroomItems.filter((classroom) => {
      const campusId = classroom?.campusId?._id || classroom?.campusId?.id || classroom?.campusId;
      return String(campusId || "") === String(newForm.campusId || "");
    });
  }, [classroomItems, isExternalNewStudent, newForm.campusId]);

  const gradeOptions = useMemo(() => {
    if (isExternalNewStudent) return EXTERNAL_GRADE_OPTIONS;
    return [...new Set(newCampusClassrooms.map((classroom) => String(classroom.grade || "").trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"));
  }, [isExternalNewStudent, newCampusClassrooms]);

  const classroomOptions = useMemo(() => {
    return newCampusClassrooms
      .filter((classroom) => String(classroom.grade || "").trim() === String(newForm.grade || "").trim())
      .map((classroom) => ({
        id: classroom._id,
        label: classroom.displayName || `${classroom.level || ""} ${classroom.grade || ""}-${classroom.section || ""}`.trim(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [newCampusClassrooms, newForm.grade]);

  function openExistingForm(student) {
    setExistingForm({
      open: true,
      student,
      attended: true,
      registerPayment: false,
      paymentAmount: "",
      paymentMethod: "CASH",
      receivedBy: "",
      notes: "",
    });
    setExistingError("");
  }

  function openPayment(row) {
    const entry = row.sessionEntry || null;
    setPaymentModal({
      open: true,
      row,
      paymentAmount: entry?.paymentAmount ? String(entry.paymentAmount) : "",
      paymentMethod: entry?.paymentMethod && entry.paymentMethod !== "PENDING" ? entry.paymentMethod : "CASH",
      receivedBy: entry?.receivedBy || "",
      notes: entry?.notes || "",
    });
    setPaymentError("");
  }

  function handleSaveAttendance(row) {
    const attended = attendanceDrafts[row.programEnrollmentId] === true;
    setAttendanceErrorByRow((prev) => ({ ...prev, [row.programEnrollmentId]: "" }));
    saveEntryMutation.mutate({
      _source: "attendance",
      programEnrollmentId: row.programEnrollmentId,
      attended,
      paymentAmount: Number(row.sessionEntry?.paymentAmount || 0),
      paymentMethod: row.sessionEntry?.paymentStatus === "PAID"
        ? (row.sessionEntry?.paymentMethod || "CASH")
        : "PENDING",
      receivedBy: row.sessionEntry?.paymentStatus === "PAID" ? (row.sessionEntry?.receivedBy || null) : null,
      notes: row.sessionEntry?.notes || "",
    });
  }

  function handleSavePayment() {
    if (!paymentModal.row?.programEnrollmentId) {
      setPaymentError("No se encontró el alumno del programa.");
      return;
    }

    const amount = Number(paymentModal.paymentAmount || 0);
    if (amount <= 0) {
      setPaymentError("Ingresa un monto mayor a 0 para registrar el pago.");
      return;
    }
    if (!paymentModal.receivedBy) {
      setPaymentError("Debes indicar quién recibió el pago.");
      return;
    }

    saveEntryMutation.mutate({
      programEnrollmentId: paymentModal.row.programEnrollmentId,
      attended: attendanceDrafts[paymentModal.row.programEnrollmentId] === true,
      paymentAmount: amount,
      paymentMethod: paymentModal.paymentMethod,
      receivedBy: paymentModal.receivedBy,
      notes: paymentModal.notes,
    });
  }

  function handleAddExistingStudent() {
    const studentId = getStudentResultId(existingForm.student);
    if (!studentId) {
      setExistingError("Selecciona un alumno existente.");
      return;
    }

    const amount = existingForm.registerPayment ? Number(existingForm.paymentAmount || 0) : 0;
    if (existingForm.registerPayment && amount <= 0) {
      setExistingError("Ingresa un monto mayor a 0 o deja el pago para después.");
      return;
    }
    if (existingForm.registerPayment && !existingForm.receivedBy) {
      setExistingError("Debes indicar quién recibió el pago.");
      return;
    }

    addStudentMutation.mutate({
      _source: "existing",
      payload: {
        existingStudentId: studentId,
        sessionId,
        attended: existingForm.attended,
        paymentAmount: amount,
        paymentMethod: existingForm.paymentMethod,
        receivedBy: existingForm.registerPayment && amount > 0 ? existingForm.receivedBy : null,
        paymentDate: todayInputValue(),
        notes: existingForm.notes.trim(),
      },
    });
  }

  function handleAddNewStudent() {
    if (!newForm.names.trim() || !newForm.lastNames.trim()) {
      setNewError("Completa apellidos y nombres del alumno.");
      return;
    }
    if (!newForm.campusId) {
      setNewError("Selecciona el origen del alumno.");
      return;
    }
    if (isExternalNewStudent) {
      if (!newForm.otherSchoolName.trim() || !newForm.grade) {
        setNewError("Indica el colegio de procedencia y el grado.");
        return;
      }
    } else if (!newForm.grade || !newForm.classroomId) {
      setNewError("Selecciona campus, grado y salón.");
      return;
    }

    const amount = newForm.registerPayment ? Number(newForm.paymentAmount || 0) : 0;
    if (newForm.registerPayment && amount <= 0) {
      setNewError("Ingresa un monto mayor a 0 o deja el pago para después.");
      return;
    }
    if (newForm.registerPayment && !newForm.receivedBy) {
      setNewError("Debes indicar quién recibió el pago.");
      return;
    }

    addStudentMutation.mutate({
      _source: "new",
      payload: {
        newStudent: {
          names: newForm.names.trim(),
          lastNames: newForm.lastNames.trim(),
          classroomId: isExternalNewStudent ? undefined : newForm.classroomId,
          otherSchoolName: isExternalNewStudent ? newForm.otherSchoolName.trim() : "",
          grade: newForm.grade,
        },
        sessionId,
        attended: newForm.attended,
        paymentAmount: amount,
        paymentMethod: newForm.paymentMethod,
        receivedBy: newForm.registerPayment && amount > 0 ? newForm.receivedBy : null,
        paymentDate: todayInputValue(),
        notes: newForm.notes.trim(),
      },
    });
  }

  if (detailQuery.isLoading) {
    return <Card className="border border-gray-200 text-sm text-gray-500">Cargando sesión...</Card>;
  }

  if (detailQuery.isError || !detail) {
    return (
      <Card className="border border-red-100 text-sm text-red-700">
        {getErrorMessage(detailQuery.error, "No se pudo cargar la sesión")}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {detail.program?.name || "Programa"} · {String(detail.session?.date || "").slice(0, 10)}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Desde aquí puedes matricular alumnos al programa, marcar asistencia del día y registrar pagos de la sesión.
            </p>
          </div>
          <SecondaryButton onClick={() => navigate(ROUTES.dashboardProgramDetail(programId))}>Volver al programa</SecondaryButton>
        </div>
      </Card>

      <Card className="border border-gray-200">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                value={existingSearch}
                onChange={(e) => setExistingSearch(e.target.value)}
                placeholder="Buscar alumno existente en todos los campus"
                className="w-full border-0 bg-transparent text-sm outline-none"
              />
            </div>
            {String(existingSearch || "").trim().length >= 2 ? (
              <div className="rounded-xl border border-gray-200 bg-white">
                {availableSearchItems.map((item) => (
                  <button
                    key={getStudentResultId(item)}
                    type="button"
                    onClick={() => openExistingForm(item)}
                    className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {[item.lastNames, item.names].filter(Boolean).join(", ") || "Alumno"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        DNI: {item.dni || "-"} · Código: {item.code || "-"} · Campus: {item.campusCode || "-"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-blue-700">Matricular</span>
                  </button>
                ))}
                {!availableSearchItems.length ? (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    {existingSearchQuery.isLoading ? "Buscando..." : "No hay alumnos disponibles para agregar al programa."}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-start xl:justify-end">
            <Button className="w-full gap-2 xl:w-auto" onClick={() => { setNewForm({ ...createInitialNewForm(), open: true }); setNewError(""); }}>
              <Plus className="h-4 w-4" />
              Agregar alumno nuevo
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border border-gray-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-sm">
            <Input
              label="Buscar alumno del programa"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Apellidos, nombres, DNI o código"
            />
          </div>
          <div className="text-sm text-gray-600">
            Sesión: {String(detail.session?.date || "").slice(0, 10)} {detail.session?.notes ? `· ${detail.session.notes}` : ""}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-3 py-2 font-medium">Alumno</th>
                <th className="px-3 py-2 font-medium">Campus</th>
                <th className="px-3 py-2 font-medium">Salón</th>
                <th className="px-3 py-2 font-medium">Asistencia</th>
                <th className="px-3 py-2 font-medium">Pago</th>
                <th className="px-3 py-2 font-medium">Recibió</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((row) => {
                const attended = attendanceDrafts[row.programEnrollmentId] === true;
                const attendanceError = attendanceErrorByRow[row.programEnrollmentId] || "";
                return (
                  <tr key={row.programEnrollmentId}>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900">{row.student?.fullName || "Alumno"}</p>
                      <p className="text-xs text-gray-500">DNI: {row.student?.dni || "-"} · Código: {row.student?.internalCode || "-"}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{row.campus?.name || row.campus?.code || "-"}</td>
                    <td className="px-3 py-3 text-gray-700">{row.classroom?.displayName || "-"}</td>
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={attended}
                            onChange={(e) => {
                              const nextChecked = e.target.checked;
                              setAttendanceDrafts((prev) => ({ ...prev, [row.programEnrollmentId]: nextChecked }));
                              setAttendanceErrorByRow((prev) => ({ ...prev, [row.programEnrollmentId]: "" }));
                            }}
                          />
                          {attended ? "Asistió" : "Faltó"}
                        </label>
                        <SecondaryButton
                          className="px-3 py-1.5 text-xs"
                          onClick={() => handleSaveAttendance(row)}
                          disabled={saveEntryMutation.isPending}
                        >
                          Guardar asistencia
                        </SecondaryButton>
                        {attendanceError ? <p className="text-xs text-red-600">{attendanceError}</p> : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {row.sessionEntry?.paymentStatus === "PAID"
                        ? `S/ ${Number(row.sessionEntry.paymentAmount || 0).toFixed(2)}`
                        : "Debe"}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{row.sessionEntry?.receivedBy || "-"}</td>
                    <td className="px-3 py-3">
                      <Button className="gap-2" onClick={() => openPayment(row)}>
                        Registrar pago
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filteredStudents.length ? <p className="px-3 py-4 text-sm text-gray-500">No se encontraron alumnos.</p> : null}
        </div>
      </Card>

      <BaseModal
        open={existingForm.open}
        onClose={() => !addStudentMutation.isPending && setExistingForm(createInitialExistingForm())}
        title="Matricular alumno existente al programa"
        maxWidthClass="max-w-2xl"
        footer={(
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setExistingForm(createInitialExistingForm())} disabled={addStudentMutation.isPending}>
              Cancelar
            </SecondaryButton>
            <Button onClick={handleAddExistingStudent} disabled={addStudentMutation.isPending}>
              Matricular al programa
            </Button>
          </div>
        )}
      >
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="font-medium text-gray-900">
              {[existingForm.student?.lastNames, existingForm.student?.names].filter(Boolean).join(", ") || "Alumno"}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              DNI: {existingForm.student?.dni || "-"} · Código: {existingForm.student?.code || "-"} · Campus: {existingForm.student?.campusCode || "-"}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={existingForm.attended}
              onChange={(e) => setExistingForm((prev) => ({ ...prev, attended: e.target.checked }))}
            />
            Marcar asistencia en esta sesión
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={existingForm.registerPayment}
              onChange={(e) => setExistingForm((prev) => ({
                ...prev,
                registerPayment: e.target.checked,
                paymentAmount: e.target.checked ? prev.paymentAmount : "",
                receivedBy: e.target.checked ? prev.receivedBy : "",
              }))}
            />
            Registrar pago en esta sesión
          </label>
          {existingForm.registerPayment ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Monto pagado"
                  type="number"
                  min="0"
                  step="0.01"
                  value={existingForm.paymentAmount}
                  onChange={(e) => setExistingForm((prev) => ({ ...prev, paymentAmount: e.target.value }))}
                />
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-gray-700">Método de pago</label>
                  <select
                    className="rounded border px-3 py-2 text-sm"
                    value={existingForm.paymentMethod}
                    onChange={(e) => setExistingForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    {PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-700">Recibió</label>
                <select
                  className="rounded border px-3 py-2 text-sm"
                  value={existingForm.receivedBy}
                  onChange={(e) => setExistingForm((prev) => ({ ...prev, receivedBy: e.target.value }))}
                >
                  <option value="">Selecciona</option>
                  {RECEIVERS.map((receiver) => <option key={receiver} value={receiver}>{receiver}</option>)}
                </select>
              </div>
            </>
          ) : null}
          <Input label="Notas" value={existingForm.notes} onChange={(e) => setExistingForm((prev) => ({ ...prev, notes: e.target.value }))} />
          {existingError ? <p className="text-sm text-red-600">{existingError}</p> : null}
        </div>
      </BaseModal>

      <BaseModal
        open={newForm.open}
        onClose={() => !addStudentMutation.isPending && setNewForm(createInitialNewForm())}
        title="Agregar alumno nuevo al programa"
        maxWidthClass="max-w-3xl"
        footer={(
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setNewForm(createInitialNewForm())} disabled={addStudentMutation.isPending}>
              Cancelar
            </SecondaryButton>
            <Button onClick={handleAddNewStudent} disabled={addStudentMutation.isPending}>
              Crear y matricular
            </Button>
          </div>
        )}
      >
        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Apellidos"
              value={newForm.lastNames}
              onChange={(e) => { setNewForm((prev) => ({ ...prev, lastNames: e.target.value })); setNewError(""); }}
            />
            <Input
              label="Nombres"
              value={newForm.names}
              onChange={(e) => { setNewForm((prev) => ({ ...prev, names: e.target.value })); setNewError(""); }}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Campus</label>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={newForm.campusId}
                onChange={(e) => setNewForm((prev) => ({ ...prev, campusId: e.target.value, grade: "", classroomId: "", otherSchoolName: "" }))}
              >
                <option value="">Selecciona</option>
                {campusSelectorOptions.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Grado</label>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={newForm.grade}
                onChange={(e) => setNewForm((prev) => ({ ...prev, grade: e.target.value, classroomId: "" }))}
              >
                <option value="">Selecciona</option>
                {gradeOptions.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
              </select>
            </div>
            {isExternalNewStudent ? (
              <Input
                label="Nombre del colegio"
                value={newForm.otherSchoolName}
                onChange={(e) => setNewForm((prev) => ({ ...prev, otherSchoolName: e.target.value }))}
              />
            ) : (
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-700">Salón</label>
                <select
                  className="rounded border px-3 py-2 text-sm"
                  value={newForm.classroomId}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, classroomId: e.target.value }))}
                >
                  <option value="">Selecciona</option>
                  {classroomOptions.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
                </select>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={newForm.attended}
              onChange={(e) => setNewForm((prev) => ({ ...prev, attended: e.target.checked }))}
            />
            Marcar asistencia en esta sesión
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={newForm.registerPayment}
              onChange={(e) => setNewForm((prev) => ({
                ...prev,
                registerPayment: e.target.checked,
                paymentAmount: e.target.checked ? prev.paymentAmount : "",
                receivedBy: e.target.checked ? prev.receivedBy : "",
              }))}
            />
            Registrar pago en esta sesión
          </label>

          {newForm.registerPayment ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Monto pagado"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newForm.paymentAmount}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, paymentAmount: e.target.value }))}
                />
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-gray-700">Método de pago</label>
                  <select
                    className="rounded border px-3 py-2 text-sm"
                    value={newForm.paymentMethod}
                    onChange={(e) => setNewForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    {PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-700">Recibió</label>
                <select
                  className="rounded border px-3 py-2 text-sm"
                  value={newForm.receivedBy}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, receivedBy: e.target.value }))}
                >
                  <option value="">Selecciona</option>
                  {RECEIVERS.map((receiver) => <option key={receiver} value={receiver}>{receiver}</option>)}
                </select>
              </div>
            </>
          ) : null}

          <Input label="Notas" value={newForm.notes} onChange={(e) => setNewForm((prev) => ({ ...prev, notes: e.target.value }))} />
          {newError ? <p className="text-sm text-red-600">{newError}</p> : null}
        </div>
      </BaseModal>

      <BaseModal
        open={paymentModal.open}
        onClose={() => !saveEntryMutation.isPending && setPaymentModal(createInitialPaymentModal())}
        title="Registrar pago de la sesión"
        maxWidthClass="max-w-xl"
        footer={(
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setPaymentModal(createInitialPaymentModal())} disabled={saveEntryMutation.isPending}>
              Cancelar
            </SecondaryButton>
            <Button onClick={handleSavePayment} disabled={saveEntryMutation.isPending}>
              Guardar pago
            </Button>
          </div>
        )}
      >
        <div className="space-y-4 px-5 py-4">
          <p className="text-sm font-medium text-gray-900">{paymentModal.row?.student?.fullName || "Alumno"}</p>
          <Input
            label="Monto pagado"
            type="number"
            min="0"
            step="0.01"
            value={paymentModal.paymentAmount}
            onChange={(e) => { setPaymentModal((prev) => ({ ...prev, paymentAmount: e.target.value })); setPaymentError(""); }}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Método de pago</label>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={paymentModal.paymentMethod}
                onChange={(e) => setPaymentModal((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              >
                {PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Recibió</label>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={paymentModal.receivedBy}
                onChange={(e) => { setPaymentModal((prev) => ({ ...prev, receivedBy: e.target.value })); setPaymentError(""); }}
              >
                <option value="">Selecciona</option>
                {RECEIVERS.map((receiver) => <option key={receiver} value={receiver}>{receiver}</option>)}
              </select>
            </div>
          </div>
          <Input
            label="Notas"
            value={paymentModal.notes}
            onChange={(e) => setPaymentModal((prev) => ({ ...prev, notes: e.target.value }))}
          />
          {paymentError ? <p className="text-sm text-red-600">{paymentError}</p> : null}
        </div>
      </BaseModal>
    </div>
  );
}
