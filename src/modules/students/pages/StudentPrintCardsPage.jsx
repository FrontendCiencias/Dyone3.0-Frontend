import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import Input from "../../../components/ui/Input";
import { ROUTES } from "../../../config/routes";
import { useCampusesQuery } from "../../admin/hooks/useCampusesQuery";
import { useClassroomsQuery } from "../../admin/hooks/useClassroomsQuery";
import { fetchStudentsForPrintCards } from "../services/studentPrintCards.service";

function getErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "No se pudo cargar alumnos para impresión.";
}

export default function StudentPrintCardsPage() {
  const navigate = useNavigate();
  const campusesQuery = useCampusesQuery();
  const classroomsQuery = useClassroomsQuery();

  const [filters, setFilters] = useState({
    q: "",
    campus: "",
    level: "",
    grade: "",
    section: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const campuses = useMemo(() => (Array.isArray(campusesQuery.data) ? campusesQuery.data : []), [campusesQuery.data]);

  const classrooms = useMemo(() => {
    const rows = Array.isArray(classroomsQuery.data)
      ? classroomsQuery.data
      : Array.isArray(classroomsQuery.data?.items)
        ? classroomsQuery.data.items
        : [];

    return rows.filter((classroom) => {
      if (!filters.campus) return true;
      const code = String(classroom?.campusCode || classroom?.campusAlias || "").toUpperCase();
      return !code || code === String(filters.campus).toUpperCase();
    });
  }, [classroomsQuery.data, filters.campus]);

  const levels = useMemo(() => {
    const values = new Set();
    classrooms.forEach((classroom) => {
      const level = String(classroom?.level || "").trim();
      if (level) values.add(level);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
  }, [classrooms]);

  const grades = useMemo(() => {
    const values = new Set();
    classrooms
      .filter((classroom) => !filters.level || String(classroom?.level || "") === String(filters.level))
      .forEach((classroom) => {
        const grade = String(classroom?.grade || "").trim();
        if (grade) values.add(grade);
      });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  }, [classrooms, filters.level]);

  const sections = useMemo(() => {
    const values = new Set();
    classrooms
      .filter((classroom) => !filters.level || String(classroom?.level || "") === String(filters.level))
      .filter((classroom) => !filters.grade || String(classroom?.grade || "") === String(filters.grade))
      .forEach((classroom) => {
        const section = String(classroom?.section || "").trim();
        if (section) values.add(section);
      });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
  }, [classrooms, filters.level, filters.grade]);

  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.studentId));

  const handleSearch = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetchStudentsForPrintCards({
        studentIds: [],
        filters,
      });

      const rows = Array.isArray(response.items) ? response.items : [];
      setItems(rows);
      setSelectedIds((prev) => {
        const next = new Set();
        rows.forEach((item) => {
          if (prev.has(item.studentId)) next.add(item.studentId);
        });
        return next;
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setItems([]);
      setSelectedIds(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRow = (studentId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }

    const next = new Set();
    items.forEach((item) => next.add(item.studentId));
    setSelectedIds(next);
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const handlePrint = async () => {
    const studentIds = Array.from(selectedIds);
    if (!studentIds.length) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await fetchStudentsForPrintCards({
        studentIds,
        filters,
      });

      const items = Array.isArray(response.items) ? response.items : [];
      const printCardsKey = `student-print-cards-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(printCardsKey, JSON.stringify({ items }));

      const previewUrl = `${ROUTES.dashboardStudentsPrintCardsPreview}?printCardsKey=${encodeURIComponent(printCardsKey)}`;
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Imprimir cards</h1>
            <p className="text-sm text-gray-600">Selecciona alumnos para imprimir sus tarjetas con código de barras</p>
          </div>
          <SecondaryButton onClick={() => navigate(ROUTES.dashboardStudents)}>Volver a alumnos</SecondaryButton>
        </div>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <div className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <Input
              label="Buscar"
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Nombre, apellido, DNI o código"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Campus</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={filters.campus}
              onChange={(e) => setFilters((prev) => ({ ...prev, campus: e.target.value }))}
            >
              <option value="">Todos</option>
              {campuses.map((campus) => (
                <option key={campus.id || campus.code} value={campus.code || ""}>
                  {campus.name || campus.code || "-"}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Nivel</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={filters.level}
              onChange={(e) => setFilters((prev) => ({ ...prev, level: e.target.value, grade: "", section: "" }))}
            >
              <option value="">Todos</option>
              {levels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Grado</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={filters.grade}
              onChange={(e) => setFilters((prev) => ({ ...prev, grade: e.target.value, section: "" }))}
            >
              <option value="">Todos</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Sección</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={filters.section}
              onChange={(e) => setFilters((prev) => ({ ...prev, section: e.target.value }))}
            >
              <option value="">Todas</option>
              {sections.map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button onClick={handleSearch} disabled={isLoading}>{isLoading ? "Cargando..." : "Buscar"}</Button>
        </div>

        {error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-700">
          <p>Resultados: <span className="font-semibold">{items.length}</span></p>
          <p>Seleccionados: <span className="font-semibold">{selectedIds.size}</span></p>
        </div>

        <div className="max-h-[45vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-700">
                <th className="px-3 py-2">
                  <input type="checkbox" checked={allSelected} onChange={handleToggleAll} aria-label="Seleccionar todos" />
                </th>
                <th className="px-3 py-2">Alumno</th>
                <th className="px-3 py-2">DNI</th>
                <th className="px-3 py-2">Campus</th>
                <th className="px-3 py-2">Grado / sección</th>
                <th className="px-3 py-2">Código interno</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const fullName = [item.lastNames, item.names].filter(Boolean).join(", ") || "-";
                const classroom = item.classroomLabel || [item.grade, item.section].filter(Boolean).join(" - ") || "-";

                return (
                  <tr key={item.studentId} className="border-b">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.studentId)}
                        onChange={() => handleToggleRow(item.studentId)}
                        aria-label={`Seleccionar ${fullName}`}
                      />
                    </td>
                    <td className="px-3 py-2">{fullName}</td>
                    <td className="px-3 py-2">{item.dni || "-"}</td>
                    <td className="px-3 py-2">{item.campusCode || "-"}</td>
                    <td className="px-3 py-2">{classroom}</td>
                    <td className="px-3 py-2">{item.internalCode || "-"}</td>
                  </tr>
                );
              })}

              {!items.length && (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={6}>
                    {isLoading ? "Cargando..." : "No se encontraron alumnos"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <SecondaryButton onClick={handleClearSelection} disabled={!selectedIds.size || isLoading}>Limpiar selección</SecondaryButton>
          <Button onClick={handlePrint} disabled={!selectedIds.size || isLoading}>{isLoading ? "Generando..." : "Imprimir seleccionados"}</Button>
        </div>
      </Card>
    </div>
  );
}
