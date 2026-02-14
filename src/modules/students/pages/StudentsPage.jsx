import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import Input from "../../../components/ui/Input";
import { useStudentsSearchQuery } from "../hooks/useStudentsSearchQuery";
import StudentSummaryModal from "../components/StudentSummaryModal";
import CreateStudentModal from "../components/CreateStudentModal";
import { useAuth } from "../../../lib/auth";
import StudentsContextBar from "../components/StudentsContextBar";
import { normalizeSearchText } from "../domain/searchText";
import { getClassroomCapacityStatus } from "../domain/classroomCapacityStatus";

function getErrorMessage(error) {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "Ocurrió un error inesperado.";
}

function resolveCampusAlias(activeRole) {
  const role = String(activeRole || "").toUpperCase();

  if (role.includes("CIMAS")) return "CIMAS";
  if (role.includes("CIENCIAS_APLICADAS") || role.includes("CIENCIAS_PRIM")) return "CIENCIAS_APLICADAS";
  if (role.includes("CIENCIAS")) return "CIENCIAS";

  return null;
}

function isGlobalRole(activeRole) {
  const role = String(activeRole || "").toUpperCase();
  return role.startsWith("ADMIN") || role.startsWith("PROMOTER");
}

function isSecretaryRole(activeRole) {
  const role = String(activeRole || "").toUpperCase();
  return role.startsWith("SECRETARY");
}

function fullName(student) {
  const lastNames = String(student?.lastNames || "").trim();
  const names = String(student?.names || "").trim();
  if (lastNames && names) return `${lastNames}, ${names}`;
  return lastNames || names || "-";
}

function getGrade(student) {
  return student?.lastKnownGrade || student?.grade || "-";
}

function getSection(student) {
  return student?.lastKnownSection || student?.section || "-";
}

function getClassroomLabel(student) {
  const grade = getGrade(student);
  const section = getSection(student);
  if (grade === "-" && section === "-") return "-";
  return `${grade} - ${section}`;
}

function getDebtTotal(student) {
  const value = Number(student?.totalDebt || student?.debtTotal || 0);
  return Number.isNaN(value) ? 0 : value;
}

function formatMoney(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function getEnrollmentStatus(student) {
  const raw = String(
    student?.enrollmentStatus ||
      student?.enrollment?.status ||
      student?.status ||
      student?.studentStatus ||
      ""
  ).toUpperCase();

  if (raw.includes("TRANSFER") || raw.includes("TRASLAD")) {
    return { key: "TRANSFERRED", label: "Trasladado", classes: "bg-amber-100 text-amber-700" };
  }

  if (raw.includes("ABSENT") || raw.includes("AUSENT")) {
    return { key: "ABSENT", label: "Ausente", classes: "bg-rose-100 text-rose-700" };
  }

  if (raw.includes("ENROLL") || raw.includes("MATRICUL") || raw.includes("CONFIRMED")) {
    return { key: "ENROLLED", label: "Matriculado", classes: "bg-emerald-100 text-emerald-700" };
  }

  return student?.isActive
    ? { key: "ENROLLED", label: "Matriculado", classes: "bg-emerald-100 text-emerald-700" }
    : { key: "ABSENT", label: "Ausente", classes: "bg-rose-100 text-rose-700" };
}

function pickNumericValue(student, candidates) {
  for (const key of candidates) {
    const value = Number(student?.[key]);
    if (!Number.isNaN(value)) return value;
  }
  return null;
}

export default function StudentsPage() {
  const { activeRole } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showTransferred, setShowTransferred] = useState("hide");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cursor, setCursor] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const secretaryMode = isSecretaryRole(activeRole);
  const globalMode = isGlobalRole(activeRole);
  const activeCampusAlias = resolveCampusAlias(activeRole);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const searchQuery = useStudentsSearchQuery({
    q: secretaryMode ? "" : searchTerm,
    cursor,
    enabled: globalMode ? Boolean(searchTerm.trim()) : true,
    mode: secretaryMode ? "campusFull" : globalMode ? "global" : "campus",
    campus: activeCampusAlias,
    limit: secretaryMode ? 1000 : 10,
  });

  const nextCursor = searchQuery.data?.nextCursor || null;

  useEffect(() => {
    setCursor(null);
    setResults([]);
    setSearchTerm("");
    setSearchInput("");
    setDebouncedSearch("");
    setShowTransferred("hide");
    setClassroomFilter("");
  }, [activeRole]);

  useEffect(() => {
    if (!searchQuery.data) return;

    const items = Array.isArray(searchQuery.data.items) ? searchQuery.data.items : [];
    setResults((prev) => (cursor && !secretaryMode ? [...prev, ...items] : items));
  }, [searchQuery.data, cursor, secretaryMode]);

  const classroomOptions = useMemo(() => {
    const values = new Set();
    results.forEach((student) => {
      const classroom = getClassroomLabel(student);
      if (classroom !== "-") values.add(classroom);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
  }, [results]);

  const secretaryFilteredResults = useMemo(() => {
    if (!secretaryMode) return results;

    const normalizedQuery = normalizeSearchText(debouncedSearch);
    const shouldFilterBySearch = normalizedQuery.length >= 2;

    return results.filter((student) => {
      const matchesSearch = !shouldFilterBySearch
        ? true
        : [student?.dni, student?.code, student?.names, student?.lastNames]
            .filter(Boolean)
            .some((value) => normalizeSearchText(value).includes(normalizedQuery));

      const enrollmentStatus = getEnrollmentStatus(student);
      const includeTransferred = showTransferred === "show";
      const passesTransferred = includeTransferred || enrollmentStatus.key !== "TRANSFERRED";

      const classroom = getClassroomLabel(student);
      const matchesClassroom = !classroomFilter || classroom === classroomFilter;

      return matchesSearch && passesTransferred && matchesClassroom;
    });
  }, [results, secretaryMode, debouncedSearch, showTransferred, classroomFilter]);

  const dataToRender = secretaryMode ? secretaryFilteredResults : results;
  const hasResults = dataToRender.length > 0;

  const selectedClassroomStudents = useMemo(() => {
    if (!classroomFilter) return [];
    return results.filter((student) => getClassroomLabel(student) === classroomFilter);
  }, [results, classroomFilter]);

  const classroomMetrics = useMemo(() => {
    if (!classroomFilter || selectedClassroomStudents.length === 0) return null;

    const sample = selectedClassroomStudents[0];
    const capacity = pickNumericValue(sample, ["capacity", "classroomCapacity", "vacanciesTotal"]);
    if (capacity === null) return null;

    const occupiedRaw = pickNumericValue(sample, ["occupied", "enrolledCount", "classroomOccupied"]);
    const occupied = occupiedRaw === null ? selectedClassroomStudents.length : occupiedRaw;

    const availableRaw = pickNumericValue(sample, ["available", "availableSeats", "vacanciesAvailable"]);
    const available = availableRaw === null ? capacity - occupied : availableRaw;

    return {
      capacity,
      occupied,
      available,
      status: getClassroomCapacityStatus(available),
    };
  }, [classroomFilter, selectedClassroomStudents]);

  const totalFromBackend = Number(searchQuery.data?.total);
  const resultsTotal = Number.isFinite(totalFromBackend)
    ? totalFromBackend
    : secretaryMode
      ? dataToRender.length
      : results.length;

  const contextTotals = {
    results: secretaryMode ? dataToRender.length : resultsTotal,
  };

  const handleSearch = () => {
    if (globalMode && !searchInput.trim()) return;

    setCursor(null);
    setResults([]);
    setSearchTerm(searchInput.trim());
  };

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        {secretaryMode ? (
          <StudentsContextBar
            campus={activeCampusAlias}
            salonSeleccionado={classroomFilter}
            q={searchInput}
            totals={contextTotals}
            capacity={classroomMetrics?.capacity}
            occupied={classroomMetrics?.occupied}
            available={classroomMetrics?.available}
            status={classroomMetrics?.status}
          />
        ) : (
          <div className="mb-2 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
            {globalMode
              ? "Modo global: busca alumnos en todas las sedes."
              : `Campus activo: ${activeCampusAlias || "No detectado"}`}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className={secretaryMode ? "md:col-span-6" : "md:col-span-9"}>
            <Input
              className="w-full"
              label="Buscar alumno"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por DNI, nombre o código"
            />
          </div>

          {secretaryMode ? (
            <>
              <div className="md:col-span-3">
                <label className="mb-1 block text-sm font-medium text-gray-700">Salón (grado - sección)</label>
                <select
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={classroomFilter}
                  onChange={(e) => setClassroomFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  {classroomOptions.map((classroom) => (
                    <option key={classroom} value={classroom}>
                      {classroom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="mb-1 block text-sm font-medium text-gray-700">Trasladados</label>
                <select
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={showTransferred}
                  onChange={(e) => setShowTransferred(e.target.value)}
                >
                  <option value="hide">No mostrar</option>
                  <option value="show">Mostrar</option>
                </select>
              </div>
            </>
          ) : (
            <div className="md:col-span-3">
              <Button
                onClick={handleSearch}
                disabled={(globalMode && !searchInput.trim()) || searchQuery.isFetching}
                className="w-full"
              >
                {searchQuery.isFetching && !cursor ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          )}
        </div>

        {secretaryMode && (
          <div className="mt-3 flex justify-end">
            <SecondaryButton className="w-full md:w-auto" onClick={() => setCreateModalOpen(true)}>
              + Nuevo alumno
            </SecondaryButton>
          </div>
        )}

        {searchQuery.isError && (
          <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{getErrorMessage(searchQuery.error)}</p>
        )}
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-700">
                <th className="px-3 py-2">DNI</th>
                <th className="px-3 py-2">Apellidos y nombres</th>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Salón</th>
                {secretaryMode ? null : <th className="px-3 py-2">Campus</th>}
                <th className="px-3 py-2">Estado matrícula</th>
                <th className="px-3 py-2">Deuda total</th>
              </tr>
            </thead>
            <tbody>
              {dataToRender.map((student) => {
                const enrollmentStatus = getEnrollmentStatus(student);

                return (
                  <tr
                    key={student.id}
                    className="cursor-pointer border-b transition-colors hover:bg-gray-50"
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <td className="px-3 py-2">{student.dni || "-"}</td>
                    <td className="px-3 py-2">{fullName(student)}</td>
                    <td className="px-3 py-2">{student.code || "-"}</td>
                    <td className="px-3 py-2">{getClassroomLabel(student)}</td>
                    {secretaryMode ? null : <td className="px-3 py-2">{student.campusCode || "-"}</td>}
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${enrollmentStatus.classes}`}>
                        {enrollmentStatus.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">{formatMoney(getDebtTotal(student))}</td>
                  </tr>
                );
              })}

              {!hasResults && (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={secretaryMode ? 6 : 7}>
                    {searchQuery.isFetching ? "Cargando..." : "Sin resultados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!secretaryMode && nextCursor && (
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setCursor(nextCursor)} disabled={searchQuery.isFetching}>
              {searchQuery.isFetching ? "Cargando..." : "Cargar más"}
            </Button>
          </div>
        )}
      </Card>

      <CreateStudentModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />

      <StudentSummaryModal
        open={Boolean(selectedStudentId)}
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
}
