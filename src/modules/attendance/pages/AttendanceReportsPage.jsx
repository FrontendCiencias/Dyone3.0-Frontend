import React, { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import BaseModal from "../../../shared/ui/BaseModal";
import { useAuth } from "../../../lib/auth";
import { useStudentsSearchQuery } from "../../students/hooks/useStudentsSearchQuery";
import { useAttendanceStudentMonthlySummaryQuery } from "../hooks/useAttendanceStudentMonthlySummaryQuery";
import { useAttendanceBatchJustificationMutation } from "../hooks/useAttendanceBatchJustificationMutation";
import { useAttendanceClassroomOptionsQuery } from "../hooks/useAttendanceClassroomOptionsQuery";
import { useAttendanceClassroomDailyReportQuery } from "../hooks/useAttendanceClassroomDailyReportQuery";

function formatMonthInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatLongDate(value) {
  if (!value) return "-";
  const formatted = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T00:00:00`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStudentFullName(student) {
  const lastNames = String(student?.lastNames || "").trim();
  const names = String(student?.names || "").trim();
  if (lastNames && names) return `${lastNames}, ${names}`;
  return lastNames || names || student?.fullName || "-";
}

function getStudentCode(student) {
  return student?.internalCode || student?.code || "-";
}

function normalizeSearchValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getAttendanceTone(status, justificationStatus) {
  if (justificationStatus === "JUSTIFIED") return "border-violet-200 bg-violet-50 text-violet-700";
  if (status === "ABSENT") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "LATE") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "PRESENT") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-gray-200 bg-gray-50 text-gray-600";
}

function getAttendanceLabel(status, justificationStatus) {
  if (justificationStatus === "JUSTIFIED" && status === "ABSENT") return "Justificada";
  if (justificationStatus === "JUSTIFIED" && status === "LATE") return "Tardanza justificada";
  if (status === "ABSENT") return "Falta";
  if (status === "LATE") return "Tardanza";
  if (status === "PRESENT") return "Temprano";
  if (status === "UNMARKED") return "Sin marcar";
  if (status === "NO_SESSION") return "Sin sesión";
  return status || "-";
}

function getCalendarCellTone(record) {
  if (!record) return "border-gray-100 bg-white text-gray-300";
  if (record.justificationStatus === "JUSTIFIED") return "border-violet-200 bg-violet-50 text-violet-700";
  if (record.status === "ABSENT") return "border-rose-200 bg-rose-50 text-rose-700";
  if (record.status === "LATE") return "border-rose-200 bg-rose-50 text-rose-700";
  if (record.status === "PRESENT") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-gray-100 bg-gray-50 text-gray-500";
}

function buildCalendarDays(year, month, records) {
  if (!year || !month) return [];

  const recordByDate = new Map(records.map((record) => [record.date, record]));
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push({ key: `empty-${index}`, empty: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      key: date,
      empty: false,
      day,
      record: recordByDate.get(date) || null,
    });
  }

  return cells;
}

function canBulkJustify(record) {
  return ["LATE", "ABSENT"].includes(record?.status) && record?.justificationStatus !== "JUSTIFIED";
}

function KpiCard({ label, value, tone = "default" }) {
  const toneClasses = {
    default: "border-gray-100 bg-white text-gray-950",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accent: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses[tone] || toneClasses.default}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export default function AttendanceReportsPage() {
  const { activeCampus } = useAuth();
  const [reportType, setReportType] = useState("student");
  const [studentSearch, setStudentSearch] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [monthValue, setMonthValue] = useState(() => formatMonthInputValue());
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [justificationReason, setJustificationReason] = useState("");
  const [justifyOpen, setJustifyOpen] = useState(false);
  const [classroomId, setClassroomId] = useState("");
  const [classroomDate, setClassroomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [uiMessage, setUiMessage] = useState("");
  const normalizedStudentSearch = String(studentSearch || "").trim();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedStudentSearch(normalizedStudentSearch);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [normalizedStudentSearch]);

  const [year, month] = useMemo(() => {
    const [parsedYear, parsedMonth] = String(monthValue || "").split("-").map(Number);
    return [parsedYear, parsedMonth];
  }, [monthValue]);

  const shouldSearchStudents =
    reportType === "student" &&
    debouncedStudentSearch.length >= 3 &&
    debouncedStudentSearch !== String(selectedStudent?.fullName || "").trim();
  const shouldWarmCampusRoster = reportType === "student" && activeCampus !== "ALL";

  const studentRosterQuery = useStudentsSearchQuery({
    q: "",
    enabled: shouldWarmCampusRoster,
    campus: shouldWarmCampusRoster ? activeCampus : null,
    mode: "campus",
    limit: 2500,
  });
  const useLocalStudentSearch = shouldWarmCampusRoster;

  const studentReportQuery = useAttendanceStudentMonthlySummaryQuery({
    studentId: selectedStudent?.id,
    year,
    month,
    enabled: reportType === "student" && Boolean(selectedStudent?.id) && Boolean(year) && Boolean(month),
  });

  const classroomOptionsQuery = useAttendanceClassroomOptionsQuery(reportType === "classroom");

  const classroomReportQuery = useAttendanceClassroomDailyReportQuery({
    classroomId,
    date: classroomDate,
    enabled: reportType === "classroom" && Boolean(classroomId) && Boolean(classroomDate),
  });

  const batchJustificationMutation = useAttendanceBatchJustificationMutation();

  useEffect(() => {
    setSelectedRecordIds([]);
  }, [selectedStudent?.id, monthValue]);

  const studentRoster = Array.isArray(studentRosterQuery.data?.items) ? studentRosterQuery.data.items : [];
  const monthlyRecords = Array.isArray(studentReportQuery.data?.records) ? studentReportQuery.data.records : [];
  const classroomOptions = Array.isArray(classroomOptionsQuery.data?.items) ? classroomOptionsQuery.data.items : [];
  const classroomItems = Array.isArray(classroomReportQuery.data?.items) ? classroomReportQuery.data.items : [];
  const calendarCells = useMemo(() => buildCalendarDays(year, month, monthlyRecords), [year, month, monthlyRecords]);
  const selectedRecords = useMemo(
    () => monthlyRecords.filter((record) => selectedRecordIds.includes(record.recordId)),
    [monthlyRecords, selectedRecordIds]
  );
  const studentResults = useMemo(() => {
    if (!useLocalStudentSearch || debouncedStudentSearch.length < 3) return [];

    const normalizedQuery = normalizeSearchValue(debouncedStudentSearch);
    return studentRoster
      .filter((student) => {
        const fullName = normalizeSearchValue(getStudentFullName(student));
        const internalCode = normalizeSearchValue(getStudentCode(student));
        return fullName.includes(normalizedQuery) || internalCode.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [debouncedStudentSearch, studentRoster, useLocalStudentSearch]);
  const isStudentSearchLoading = useLocalStudentSearch && studentRosterQuery.isLoading;
  const showStudentSearchPanel =
    debouncedStudentSearch.length >= 3 &&
    shouldSearchStudents &&
    (isStudentSearchLoading || studentResults.length > 0 || !studentRosterQuery.isLoading);
  const noStudentMatches =
    showStudentSearchPanel &&
    !isStudentSearchLoading &&
    !studentRosterQuery.error &&
    !studentResults.length;

  useEffect(() => {
    if (!shouldWarmCampusRoster || !studentRoster.length) return;
    console.log("[AttendanceReports][StudentRoster][Loaded]", {
      activeCampus,
      total: studentRoster.length,
      names: studentRoster.map((student) => ({
        code: getStudentCode(student),
        fullName: getStudentFullName(student),
      })),
    });
  }, [activeCampus, shouldWarmCampusRoster, studentRoster]);

  const selectedCount = selectedRecordIds.length;
  const classroomStatusCounts = useMemo(() => classroomItems.reduce((acc, item) => {
    const status = item?.attendance?.status || "UNMARKED";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}), [classroomItems]);

  const handleStudentPick = (student) => {
    setSelectedStudent({
      id: student?._id || student?.id,
      fullName: getStudentFullName(student),
      internalCode: getStudentCode(student),
    });
    setStudentSearch(getStudentFullName(student));
  };

  const toggleRecordSelection = (recordId) => {
    setSelectedRecordIds((current) => (
      current.includes(recordId)
        ? current.filter((item) => item !== recordId)
        : [...current, recordId]
    ));
  };

  const openBulkJustification = () => {
    if (!selectedCount) return;
    setUiMessage("");
    setJustificationReason("");
    setJustifyOpen(true);
  };

  const closeBulkJustification = () => {
    if (batchJustificationMutation.isPending) return;
    setJustifyOpen(false);
    setJustificationReason("");
  };

  const handleBulkJustificationSubmit = async (event) => {
    event.preventDefault();
    const cleanReason = String(justificationReason || "").trim();
    if (!cleanReason || !selectedCount) return;

    try {
      await batchJustificationMutation.mutateAsync({
        recordIds: selectedRecordIds,
        justificationReason: cleanReason,
      });
      setUiMessage(`Se justificaron ${selectedCount} registro(s).`);
      setSelectedRecordIds([]);
      setJustifyOpen(false);
      setJustificationReason("");
    } catch (error) {
      const message = error?.response?.data?.message || "No se pudo guardar la justificación.";
      setUiMessage(Array.isArray(message) ? message.join(". ") : message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Asistencia</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">Reportes</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Consulta el reporte mensual de un alumno y el reporte diario por clase. Las justificaciones del auxiliar nacen desde el reporte mensual del alumno.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setReportType("student")}
            className={`rounded-2xl border px-5 py-4 text-left transition ${reportType === "student" ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white hover:bg-gray-50"}`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Search className="h-4 w-4 text-orange-600" />
              Reporte por alumno
            </div>
            <p className="mt-2 text-sm text-gray-600">Vista mensual con detalle por día y justificación múltiple.</p>
          </button>

          <button
            type="button"
            onClick={() => setReportType("classroom")}
            className={`rounded-2xl border px-5 py-4 text-left transition ${reportType === "classroom" ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white hover:bg-gray-50"}`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Users className="h-4 w-4 text-orange-600" />
              Reporte por clase
            </div>
            <p className="mt-2 text-sm text-gray-600">Vista diaria del salón con el estado de asistencia del día.</p>
          </button>
        </div>
      </div>

      {uiMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {uiMessage}
        </div>
      ) : null}

      {reportType === "student" ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
                <div className="relative">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Alumno</label>
                  <Input
                    value={studentSearch}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setStudentSearch(nextValue);
                      if (selectedStudent && nextValue.trim() !== String(selectedStudent.fullName || "").trim()) {
                        setSelectedStudent(null);
                      }
                    }}
                    placeholder="Busca por código, nombre o apellidos"
                    className="mt-2"
                  />

                  {showStudentSearchPanel ? (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                      {isStudentSearchLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500">Buscando alumnos...</div>
                      ) : null}
                      {!isStudentSearchLoading && studentResults.length ? (
                        studentResults.map((student) => (
                          <button
                            key={student._id || student.id}
                            type="button"
                            onClick={() => handleStudentPick(student)}
                            className="flex w-full items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                          >
                            <div>
                              <div className="text-sm font-semibold text-gray-950">{getStudentFullName(student)}</div>
                              <div className="mt-1 text-xs text-gray-500">{student?.internalCode || "-"}</div>
                            </div>
                            <div className="text-xs text-gray-500">{student?.lastKnownClassroom || student?.section || ""}</div>
                          </button>
                        ))
                      ) : null}
                      {noStudentMatches ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No encontramos alumnos que coincidan con "{debouncedStudentSearch}".
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Mes</label>
                  <Input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} className="mt-2" />
                </div>
              </div>

              {selectedStudent ? (
                <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Alumno seleccionado</div>
                  <div className="mt-2 text-lg font-semibold text-gray-950">{selectedStudent.fullName}</div>
                  <div className="mt-1 text-sm text-gray-600">Código {selectedStudent.internalCode || "-"}</div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  {normalizedStudentSearch.length > 0 && normalizedStudentSearch.length < 3
                    ? "Escribe al menos 3 caracteres para buscar un alumno."
                    : "Elige un alumno para abrir su reporte mensual y justificar faltas o tardanzas."}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              <KpiCard label="Tempranos" value={studentReportQuery.data?.summary?.presentCount || 0} tone="success" />
              <KpiCard label="Tardanzas" value={studentReportQuery.data?.summary?.lateCount || 0} tone="danger" />
              <KpiCard label="Faltas" value={studentReportQuery.data?.summary?.absentCount || 0} tone="danger" />
              <KpiCard label="Justificados" value={(studentReportQuery.data?.summary?.justifiedLateCount || 0) + (studentReportQuery.data?.summary?.justifiedAbsentCount || 0)} tone="accent" />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Detalle mensual</div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-950">Registro por día</h2>
              </div>

              <SecondaryButton onClick={openBulkJustification} disabled={!selectedCount}>
                Justificar seleccionados{selectedCount ? ` (${selectedCount})` : ""}
              </SecondaryButton>
            </div>

            {studentReportQuery.isLoading ? (
              <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-6 text-sm text-gray-500">Cargando reporte mensual…</div>
            ) : null}

            {studentReportQuery.error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
                No se pudo cargar el reporte del alumno.
              </div>
            ) : null}

            {!studentReportQuery.isLoading && selectedStudent && !monthlyRecords.length ? (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                Este alumno no tiene registros de asistencia en el mes seleccionado.
              </div>
            ) : null}

            {monthlyRecords.length ? (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarCells.map((cell) => {
                    if (cell.empty) {
                      return <div key={cell.key} className="h-20 rounded-2xl border border-transparent" />;
                    }

                    const record = cell.record;
                    const selectable = canBulkJustify(record);
                    const selected = record?.recordId ? selectedRecordIds.includes(record.recordId) : false;

                    return (
                      <div key={cell.key} className="group relative">
                        <button
                          type="button"
                          disabled={!selectable}
                          onClick={() => selectable && toggleRecordSelection(record.recordId)}
                          className={`flex h-20 w-full items-start justify-end rounded-2xl border p-3 text-right transition ${getCalendarCellTone(record)} ${selected ? "ring-2 ring-orange-300" : ""} ${selectable ? "hover:brightness-[0.99]" : ""} ${!selectable && record ? "cursor-default" : ""}`}
                        >
                          <span className="text-lg font-semibold leading-none">{String(cell.day).padStart(2, "0")}</span>
                        </button>

                        {record?.justificationStatus === "JUSTIFIED" ? (
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-2xl border border-violet-200 bg-white px-3 py-3 text-left shadow-xl group-hover:block">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">
                              Justificación
                            </div>
                            <div className="mt-2 text-sm font-medium text-gray-900">
                              {record.justificationReason || "Sin detalle"}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Ejecutada: {formatDateTime(record.justifiedAt)}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[1fr_0.5fr]">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Clase</label>
                <select
                  value={classroomId}
                  onChange={(event) => setClassroomId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-orange-300"
                >
                  <option value="">Selecciona un salón</option>
                  {classroomOptions.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.displayName} · {classroom.campus?.name || classroom.campus?.code || "Campus"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Día</label>
                <Input type="date" value={classroomDate} onChange={(event) => setClassroomDate(event.target.value)} className="mt-2" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Tempranos" value={classroomStatusCounts.PRESENT || 0} tone="success" />
            <KpiCard label="Tardanzas" value={classroomStatusCounts.LATE || 0} tone="danger" />
            <KpiCard label="Faltas" value={classroomStatusCounts.ABSENT || 0} tone="danger" />
            <KpiCard label="Sin marcar" value={(classroomStatusCounts.UNMARKED || 0) + (classroomStatusCounts.NO_SESSION || 0)} />
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Reporte diario</div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-950">
              {classroomReportQuery.data?.classroom?.displayName || "Clase del día"}
            </h2>

            {classroomReportQuery.isLoading ? (
              <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-6 text-sm text-gray-500">Cargando reporte diario…</div>
            ) : null}

            {!classroomReportQuery.isLoading && !classroomId ? (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                Selecciona un salón para ver su reporte diario.
              </div>
            ) : null}

            {classroomItems.length ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      <th className="px-4 py-3">Alumno</th>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {classroomItems.map((item) => (
                      <tr key={item.studentId}>
                        <td className="px-4 py-3 font-medium text-gray-950">{item?.person?.fullName || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{item?.studentCode || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getAttendanceTone(item?.attendance?.status, item?.attendance?.justificationStatus)}`}>
                            {getAttendanceLabel(item?.attendance?.status, item?.attendance?.justificationStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item?.attendance?.arrivalTime || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <BaseModal
        open={justifyOpen}
        onClose={closeBulkJustification}
        title={`Justificar ${selectedCount} registro(s)`}
        maxWidthClass="max-w-xl"
        footer={(
          <div className="flex justify-end gap-3">
            <SecondaryButton onClick={closeBulkJustification} disabled={batchJustificationMutation.isPending}>Cancelar</SecondaryButton>
            <Button
              type="submit"
              form="attendance-bulk-justification-form"
              disabled={batchJustificationMutation.isPending || String(justificationReason || "").trim().length < 3}
            >
              Guardar justificación
            </Button>
          </div>
        )}
      >
        <form id="attendance-bulk-justification-form" onSubmit={handleBulkJustificationSubmit} className="space-y-4 px-5 py-5">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm text-gray-600">
            Esta acción justificará todos los días seleccionados del reporte mensual del alumno.
          </div>
          {selectedRecords.length ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600">
                Días seleccionados
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedRecords.map((record) => (
                  <span
                    key={record.recordId}
                    className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-800"
                  >
                    {formatLongDate(record.date)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <label className="text-sm font-medium text-gray-800">Motivo</label>
            <textarea
              value={justificationReason}
              onChange={(event) => setJustificationReason(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-orange-300"
              placeholder="Escribe la justificación"
              inputMode="text"
              autoCapitalize="sentences"
              autoCorrect="on"
              enterKeyHint="done"
            />
          </div>
        </form>
      </BaseModal>
    </div>
  );
}
