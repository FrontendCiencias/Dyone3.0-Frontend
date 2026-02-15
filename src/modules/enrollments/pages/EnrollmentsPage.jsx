import React, { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import BaseModal from "../../../shared/ui/BaseModal";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import { ROUTES } from "../../../config/routes";
import { normalizeSearchText } from "../../students/domain/searchText";
import { useEnrollmentsQuery } from "../hooks/useEnrollmentsQuery";
import { useEnrollmentsStudentSearchQuery } from "../hooks/useEnrollmentsStudentSearchQuery";
import { getStudentSummary } from "../../students/services/students.service";
import { useConfirmEnrollmentMutation } from "../../students/hooks/useConfirmEnrollmentMutation";

const STATUS_FILTERS = [
  { key: "ALL", label: "Todos" },
  { key: "ABSENT", label: "Pendientes" },
  { key: "ENROLLED", label: "Matriculados" },
  { key: "TRANSFERRED", label: "Trasladados" },
];

function formatMoney(value) {
  const amount = Number(value || 0);
  return Number.isNaN(amount) ? null : `S/ ${amount.toFixed(2)}`;
}

function getErrorMessage(error, fallback = "No se pudo cargar matrículas") {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return fallback;
}

function statusLabel(status) {
  if (status === "ENROLLED") return "Matriculado";
  if (status === "TRANSFERRED") return "Trasladado";
  return "Pendiente";
}

function statusClasses(status) {
  if (status === "ENROLLED") return "bg-emerald-100 text-emerald-700";
  if (status === "TRANSFERRED") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function normalizeStatus(raw) {
  const value = String(raw || "").toUpperCase();
  if (value.includes("TRANSFER") || value.includes("TRASLAD")) return "TRANSFERRED";
  if (value.includes("ENROLL") || value.includes("MATRICUL") || value.includes("CONFIRMED")) return "ENROLLED";
  return "ABSENT";
}

function isBackendPendingError(error) {
  const status = error?.response?.status;
  return status === 404 || status === 501;
}

function mapEnrollmentItem(item) {
  const student = item?.student || {};
  const enrollmentId = item?.enrollmentId || item?.id || item?.enrollment?.id || null;
  const studentId = student?.id || student?._id || item?.studentId || null;
  const status = normalizeStatus(item?.status || item?.enrollmentStatus || item?.enrollment?.status);

  return {
    mode: "board",
    id: `${enrollmentId || "no-enrollment"}-${studentId || Math.random()}`,
    enrollmentId,
    studentId,
    student,
    status,
    classroom: item?.classroom?.displayName || item?.classroomName || item?.classroomLabel || "-",
    cycle: item?.cycle?.name || item?.cycleName || "-",
    confirmedAt: item?.confirmedAt || item?.enrollment?.confirmedAt || null,
    debtTotal: Number(item?.debtTotal),
    enrollmentSnapshot: item?.enrollment || {},
  };
}

export default function EnrollmentsPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [classroomFilter, setClassroomFilter] = useState("ALL");
  const [cycleFilter, setCycleFilter] = useState("");
  const [cursor, setCursor] = useState(null);
  const [boardRows, setBoardRows] = useState([]);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [quickForm, setQuickForm] = useState({ monthlyFee: "", discountsDescription: "", observations: "" });

  useEffect(() => {
    const normalized = searchInput.trim();
    const isExactDni = /^\d{8}$/.test(normalized);
    const isCodeLike = /^[A-Za-z0-9-]{4,}$/.test(normalized);

    if (isExactDni || isCodeLike) {
      setDebouncedSearch(normalized);
      return undefined;
    }

    const timer = window.setTimeout(() => setDebouncedSearch(normalized), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      q: debouncedSearch.trim(),
      status: statusFilter,
      classroomId: classroomFilter,
      cycleId: cycleFilter.trim() || undefined,
      limit: 20,
      cursor,
    }),
    [debouncedSearch, statusFilter, classroomFilter, cycleFilter, cursor]
  );

  const enrollmentsQuery = useEnrollmentsQuery(filters, true);
  const fallbackMode = enrollmentsQuery.isError && isBackendPendingError(enrollmentsQuery.error);

  const fallbackStudentsQuery = useEnrollmentsStudentSearchQuery({
    q: debouncedSearch,
    enabled: fallbackMode && normalizeSearchText(debouncedSearch).length >= 2,
  });

  const fallbackStudents = useMemo(
    () => (Array.isArray(fallbackStudentsQuery.data?.items) ? fallbackStudentsQuery.data.items : []),
    [fallbackStudentsQuery.data]
  );

  const fallbackSummariesTargets = useMemo(() => fallbackStudents.slice(0, 10), [fallbackStudents]);
  const fallbackSummaryQueries = useQueries({
    queries: fallbackSummariesTargets.map((student) => ({
      queryKey: ["students", "summary", student.id || student._id, "enrollments-fallback"],
      queryFn: () => getStudentSummary(student.id || student._id),
      enabled: fallbackMode && Boolean(student.id || student._id),
      retry: false,
      refetchOnWindowFocus: false,
    })),
  });

  const fallbackSummaryById = useMemo(() => {
    const map = new Map();
    fallbackSummariesTargets.forEach((student, index) => {
      const id = student.id || student._id;
      if (!id) return;
      map.set(id, fallbackSummaryQueries[index]?.data || null);
    });
    return map;
  }, [fallbackSummariesTargets, fallbackSummaryQueries]);

  useEffect(() => {
    setCursor(null);
    setBoardRows([]);
  }, [debouncedSearch, statusFilter, classroomFilter, cycleFilter]);

  useEffect(() => {
    if (fallbackMode) return;
    if (!enrollmentsQuery.data) return;

    const mapped = (Array.isArray(enrollmentsQuery.data?.items) ? enrollmentsQuery.data.items : []).map(mapEnrollmentItem);
    setBoardRows((prev) => (cursor ? [...prev, ...mapped] : mapped));
  }, [enrollmentsQuery.data, cursor, fallbackMode]);

  const fallbackRows = useMemo(() => {
    return fallbackStudents.map((student) => {
      const studentId = student.id || student._id;
      const summary = fallbackSummaryById.get(studentId) || null;
      const enrollmentStatus = summary?.enrollmentStatus || {};
      const enrollment = summary?.enrollment || {};

      const status = normalizeStatus(enrollmentStatus?.status || student?.enrollmentStatus || student?.status);
      return {
        mode: "fallback",
        id: `fallback-${studentId}`,
        enrollmentId: enrollment?.id || null,
        studentId,
        student,
        status,
        classroom: enrollmentStatus?.classroomName || enrollmentStatus?.classroom?.displayName || student?.classroomLabel || "-",
        cycle: enrollmentStatus?.cycleName || enrollmentStatus?.cycle?.name || student?.cycle || "-",
        confirmedAt: enrollment?.confirmedAt || null,
        debtTotal: Number(summary?.debtsSummary?.pendingTotal),
        enrollmentSnapshot: enrollment,
      };
    });
  }, [fallbackStudents, fallbackSummaryById]);

  const rows = fallbackMode ? fallbackRows : boardRows;

  const classroomOptions = useMemo(() => {
    const values = new Set(rows.map((row) => row.classroom).filter((item) => item && item !== "-"));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
  }, [rows]);

  const cycleOptions = useMemo(() => {
    const values = new Set(rows.map((row) => row.cycle).filter((item) => item && item !== "-"));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
  }, [rows]);

  const filteredRows = useMemo(
    () => rows.filter((row) => {
      const byStatus = statusFilter === "ALL" ? true : row.status === statusFilter;
      const byClassroom = classroomFilter === "ALL" ? true : row.classroom === classroomFilter;
      const byCycle = !cycleFilter ? true : row.cycle === cycleFilter;
      return byStatus && byClassroom && byCycle;
    }),
    [rows, statusFilter, classroomFilter, cycleFilter]
  );

  const nextCursor = enrollmentsQuery.data?.nextCursor || null;
  const canLoadMore = !fallbackMode && Boolean(nextCursor) && !enrollmentsQuery.isFetching;

  const confirmEnrollmentMutation = useConfirmEnrollmentMutation(selectedRow?.studentId);

  const openQuickConfirm = (row) => {
    setSelectedRow(row);
    setQuickForm({
      monthlyFee: row.enrollmentSnapshot?.monthlyFee ? String(row.enrollmentSnapshot.monthlyFee) : "",
      discountsDescription: row.enrollmentSnapshot?.discountsDescription || "",
      observations: row.enrollmentSnapshot?.observations || "",
    });
    setQuickModalOpen(true);
  };

  const handleQuickConfirm = async () => {
    const monthlyFee = Number(quickForm.monthlyFee);
    if (Number.isNaN(monthlyFee) || monthlyFee < 0 || !selectedRow?.studentId) return;

    const payload = {
      studentId: selectedRow.studentId,
      monthlyFee,
      discountsDescription: quickForm.discountsDescription.trim() || undefined,
      observations: quickForm.observations.trim() || undefined,
      classroomId: selectedRow?.enrollmentSnapshot?.classroomId,
      cycleId: selectedRow?.enrollmentSnapshot?.cycleId,
    };

    await confirmEnrollmentMutation.mutateAsync({
      enrollmentId: selectedRow?.enrollmentId || undefined,
      payload,
    });

    setQuickModalOpen(false);
    setSelectedRow(null);
  };

  const isLoadingMain = !fallbackMode && (enrollmentsQuery.isLoading || enrollmentsQuery.isFetching) && rows.length === 0;
  const isLoadingFallback = fallbackMode && (fallbackStudentsQuery.isLoading || fallbackStudentsQuery.isFetching);

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Matrículas</h1>
            <p className="mt-1 text-sm text-gray-600">Tablero operativo de matrícula para seguimiento administrativo.</p>
          </div>
          <Button onClick={() => navigate(ROUTES.dashboardEnrollmentCaseNew)}>Nueva Matrícula</Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-5">
            <Input
              label="Buscar"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="DNI, código o nombre del alumno"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_FILTERS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Salón</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={classroomFilter} onChange={(e) => setClassroomFilter(e.target.value)}>
              <option value="ALL">Todos</option>
              {classroomOptions.map((classroom) => <option key={classroom} value={classroom}>{classroom}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Ciclo</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)}>
              <option value="">Todos</option>
              {cycleOptions.map((cycle) => <option key={cycle} value={cycle}>{cycle}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <SecondaryButton className="w-full" onClick={() => { setSearchInput(""); setStatusFilter("ALL"); setClassroomFilter("ALL"); setCycleFilter(""); }}>
              Limpiar
            </SecondaryButton>
          </div>
        </div>
      </Card>

      {fallbackMode && (
        <Card className="border border-amber-200 bg-amber-50 text-sm text-amber-800">
          Listado de matrículas pendiente de backend (GET /api/enrollments). Modo fallback activo.
        </Card>
      )}

      {enrollmentsQuery.isError && !fallbackMode && (
        <Card className="border border-red-100 text-sm text-red-700">{getErrorMessage(enrollmentsQuery.error)}</Card>
      )}

      {isLoadingMain || isLoadingFallback ? (
        <Card className="border border-gray-200 text-sm text-gray-500">Cargando matrículas...</Card>
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => (
            <Card key={row.id} className="border border-gray-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-gray-900">{row.student?.lastNames}, {row.student?.names}</p>
                  <p className="text-sm text-gray-600">
                    DNI: {row.student?.dni || "-"} · Código: {row.student?.code || row.student?.internalCode || "-"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(row.status)}`}>{statusLabel(row.status)}</span>
                    <span>Aula: {row.classroom}</span>
                    <span>Ciclo: {row.cycle}</span>
                    {row.confirmedAt && <span>Confirmada: {String(row.confirmedAt).slice(0, 10)}</span>}
                    {Number.isFinite(row.debtTotal) && <span>Deuda: {formatMoney(row.debtTotal)}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.status === "ABSENT" && (
                    <SecondaryButton onClick={() => openQuickConfirm(row)}>Confirmar</SecondaryButton>
                  )}
                  <Button onClick={() => row.studentId && navigate(ROUTES.dashboardStudentDetail(row.studentId))}>Abrir expediente</Button>
                </div>
              </div>
            </Card>
          ))}

          {!filteredRows.length && (
            <Card className="border border-gray-200 text-sm text-gray-500">No hay matrículas para los filtros seleccionados.</Card>
          )}

          {canLoadMore && (
            <div className="flex justify-center">
              <SecondaryButton onClick={() => setCursor(nextCursor)}>Cargar más</SecondaryButton>
            </div>
          )}
        </div>
      )}

      <BaseModal
        open={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        title="Confirmación rápida de matrícula"
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setQuickModalOpen(false)} disabled={confirmEnrollmentMutation.isPending}>Cancelar</SecondaryButton>
            <Button onClick={handleQuickConfirm} disabled={confirmEnrollmentMutation.isPending}>Confirmar</Button>
          </div>
        }
      >
        <div className="space-y-3 p-5 text-sm text-gray-700">
          <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
            {selectedRow?.student?.lastNames}, {selectedRow?.student?.names} · DNI {selectedRow?.student?.dni || "-"}
          </p>
          <Input label="Pensión mensual" type="number" min="0" value={quickForm.monthlyFee} onChange={(e) => setQuickForm((prev) => ({ ...prev, monthlyFee: e.target.value }))} />
          <Input label="Descuentos / exoneraciones" value={quickForm.discountsDescription} onChange={(e) => setQuickForm((prev) => ({ ...prev, discountsDescription: e.target.value }))} />
          <label className="block text-sm font-medium text-gray-700">Observaciones</label>
          <textarea className="min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2" value={quickForm.observations} onChange={(e) => setQuickForm((prev) => ({ ...prev, observations: e.target.value }))} />
          {confirmEnrollmentMutation.isError && (
            <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{getErrorMessage(confirmEnrollmentMutation.error, "No se pudo confirmar matrícula")}</p>
          )}
          <LoadingOverlay open={confirmEnrollmentMutation.isPending}>
            <p className="text-sm text-gray-600">Procesando confirmación...</p>
          </LoadingOverlay>
        </div>
      </BaseModal>
    </div>
  );
}
