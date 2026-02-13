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

export default function StudentsPage() {
  const { activeRole } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cursor, setCursor] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const globalMode = isGlobalRole(activeRole);
  const activeCampusAlias = resolveCampusAlias(activeRole);

  const searchQuery = useStudentsSearchQuery({
    q: searchTerm,
    cursor,
    enabled: globalMode ? Boolean(searchTerm.trim()) : true,
    mode: globalMode ? "global" : "campus",
    campus: activeCampusAlias,
  });

  const nextCursor = searchQuery.data?.nextCursor || null;

  useEffect(() => {
    setCursor(null);
    setResults([]);
    setSearchTerm("");
    setSearchInput("");
  }, [activeRole]);

  useEffect(() => {
    if (!searchQuery.data) return;

    const items = Array.isArray(searchQuery.data.items) ? searchQuery.data.items : [];
    setResults((prev) => (cursor ? [...prev, ...items] : items));
  }, [searchQuery.data, cursor]);

  const handleSearch = () => {
    if (globalMode && !searchInput.trim()) return;

    setCursor(null);
    setResults([]);
    setSearchTerm(searchInput.trim());
  };

  const hasResults = useMemo(() => results.length > 0, [results.length]);

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <div className="mb-2 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
          {globalMode
            ? "Modo global: busca alumnos en todas las sedes."
            : `Campus activo: ${activeCampusAlias || "No detectado"}`}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <Input
            className="w-full"
            label="Buscar alumno"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por DNI, nombre o código"
          />
          <Button
            onClick={handleSearch}
            disabled={(globalMode && !searchInput.trim()) || searchQuery.isFetching}
          >
            {searchQuery.isFetching && !cursor ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {!globalMode && (
          <p className="mt-2 text-xs text-gray-500">
            Si dejas el buscador vacío, se listan alumnos del campus activo.
          </p>
        )}

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
                <th className="px-3 py-2">Nombre completo</th>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Campus</th>
                <th className="px-3 py-2">Grado</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {results.map((student) => (
                <tr
                  key={student.id}
                  className="cursor-pointer border-b transition-colors hover:bg-gray-50"
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <td className="px-3 py-2">{student.dni || "-"}</td>
                  <td className="px-3 py-2">{`${student.names || ""} ${student.lastNames || ""}`.trim() || "-"}</td>
                  <td className="px-3 py-2">{student.code || "-"}</td>
                  <td className="px-3 py-2">{student.campusCode || "-"}</td>
                  <td className="px-3 py-2">{student.lastKnownGrade || "-"}</td>
                  <td className="px-3 py-2">{student.isActive ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}

              {!hasResults && (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={6}>
                    {searchQuery.isFetching ? "Cargando..." : "Sin resultados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {nextCursor && (
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setCursor(nextCursor)} disabled={searchQuery.isFetching}>
              {searchQuery.isFetching ? "Cargando..." : "Cargar más"}
            </Button>
          </div>
        )}
      </Card>

      <StudentSummaryModal
        studentId={selectedStudentId}
        open={Boolean(selectedStudentId)}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
}
