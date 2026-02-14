import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { useStudentsSearchQuery } from "../hooks/useStudentsSearchQuery";
import StudentSummaryModal from "../components/StudentSummaryModal";
import { useAuth } from "../../../lib/auth";

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
  return `${student?.lastNames || ""} ${student?.names || ""}`.trim() || "-";
}

function getGrade(student) {
  return student?.lastKnownGrade || student?.grade || "-";
}

function getSection(student) {
  return student?.lastKnownSection || student?.section || "-";
}

function getDebtTotal(student) {
  const value = Number(student?.totalDebt || student?.debtTotal || 0);
  return Number.isNaN(value) ? 0 : value;
}

function formatMoney(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

export default function StudentsPage() {
  const { activeRole } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cursor, setCursor] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

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
    mode: globalMode ? "global" : "campus",
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
    setGradeFilter("");
    setSectionFilter("");
  }, [activeRole]);

  useEffect(() => {
    if (!searchQuery.data) return;

    const items = Array.isArray(searchQuery.data.items) ? searchQuery.data.items : [];
    setResults((prev) => (cursor && !secretaryMode ? [...prev, ...items] : items));
  }, [searchQuery.data, cursor, secretaryMode]);

  useEffect(() => {
    if (!secretaryMode) return;
    if (cursor) setCursor(null);
  }, [secretaryMode, cursor]);

  const secretaryFilteredResults = useMemo(() => {
    if (!secretaryMode) return results;

    return results.filter((student) => {
      const q = debouncedSearch.toLowerCase();
      const shouldFilterBySearch = q.length >= 2;

      const matchesSearch = !shouldFilterBySearch
        ? true
        : [student?.dni, student?.code, student?.names, student?.lastNames]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q));

      const studentGrade = getGrade(student);
      const studentSection = getSection(student);
      const matchesGrade = !gradeFilter || String(studentGrade) === String(gradeFilter);
      const matchesSection = !sectionFilter || String(studentSection) === String(sectionFilter);

      return matchesSearch && matchesGrade && matchesSection;
    });
  }, [results, secretaryMode, debouncedSearch, gradeFilter, sectionFilter]);

  const gradeOptions = useMemo(() => {
    const values = new Set();
    results.forEach((student) => {
      const grade = getGrade(student);
      if (grade && grade !== "-") values.add(String(grade));
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
  }, [results]);

  const sectionOptions = useMemo(() => {
    const values = new Set();
    results.forEach((student) => {
      const section = getSection(student);
      if (section && section !== "-") values.add(String(section));
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
  }, [results]);

  const dataToRender = secretaryMode ? secretaryFilteredResults : results;
  const hasResults = dataToRender.length > 0;

  const handleSearch = () => {
    if (globalMode && !searchInput.trim()) return;

    setCursor(null);
    setResults([]);
    setSearchTerm(searchInput.trim());
  };

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <div className="mb-2 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
          {globalMode
            ? "Modo global: busca alumnos en todas las sedes."
            : `Campus activo: ${activeCampusAlias || "No detectado"}`}
        </div>

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
                <label className="mb-1 block text-sm font-medium text-gray-700">Grado</label>
                <select
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="mb-1 block text-sm font-medium text-gray-700">Sección</label>
                <select
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                >
                  <option value="">Todas</option>
                  {sectionOptions.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
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

        {searchQuery.isError && (
          <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{getErrorMessage(searchQuery.error)}</p>
        )}
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-gray-900">Resultados</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-700">
                <th className="px-3 py-2">DNI</th>
                <th className="px-3 py-2">Apellidos y nombres</th>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Último grado / sección</th>
                {secretaryMode ? null : <th className="px-3 py-2">Campus</th>}
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Deuda total</th>
              </tr>
            </thead>
            <tbody>
              {dataToRender.map((student) => (
                <tr
                  key={student.id}
                  className="cursor-pointer border-b transition-colors hover:bg-gray-50"
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <td className="px-3 py-2">{student.dni || "-"}</td>
                  <td className="px-3 py-2">{fullName(student)}</td>
                  <td className="px-3 py-2">{student.code || "-"}</td>
                  <td className="px-3 py-2">{`${getGrade(student)} / ${getSection(student)}`}</td>
                  {secretaryMode ? null : <td className="px-3 py-2">{student.campusCode || "-"}</td>}
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        student.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {student.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">{formatMoney(getDebtTotal(student))}</td>
                </tr>
              ))}

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

      <StudentSummaryModal
        open={Boolean(selectedStudentId)}
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
}
