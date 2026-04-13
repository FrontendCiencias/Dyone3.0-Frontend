import React, { useEffect, useMemo, useState } from "react";
import { FileText, Filter, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import OperationalBlockState from "../../../shared/ui/OperationalBlockState";
import OperationalContextBar from "../../../shared/ui/OperationalContextBar";
import OperationalSearchBar from "../../../shared/ui/OperationalSearchBar";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { useCampusesQuery } from "../../admin/hooks/useCampusesQuery";
import { useClassroomsQuery } from "../../admin/hooks/useClassroomsQuery";
import { usePaymentsDebtorsQuery } from "../hooks/usePaymentsDebtorsQuery";
import { fetchDebtorsForPrint } from "../services/payments.service";
import { createDebtorsPrintStorageKey, saveDebtorsPrintPayload } from "../utils/debtorsPrintStorage";
import DebtorsCommunicationTemplateModal from "../components/DebtorsCommunicationTemplateModal";
import { DEFAULT_DEBTORS_COMMUNICATION_TEMPLATE } from "../utils/debtorsCommunicationTemplate";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo cargar deudores.";
}

function isSecretaryRole(activeRole) {
  return String(activeRole || "").toUpperCase().startsWith("SECRETARY");
}

function normalizeClassrooms(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function mapRow(item) {
  return {
    id: item?.studentId || item?.id || item?._id,
    fullName: item?.fullName || [item?.lastNames, item?.names].filter(Boolean).join(", ") || "-",
    names: item?.names || "",
    lastNames: item?.lastNames || "",
    dni: item?.dni || "-",
    code: item?.code || "-",
    campus: item?.campus || "-",
    level: item?.level || "",
    grade: item?.grade || "",
    section: item?.section || "",
    classroomLabel: item?.classroomLabel || [item?.grade, item?.section].filter(Boolean).join(" - ") || "-",
    totalPending: Number(item?.totalPending || 0),
    totalOverdue: Number(item?.totalOverdue || 0),
    pendingNonOverdue: Math.max(0, Number(item?.totalPending || 0) - Number(item?.totalOverdue || 0)),
  };
}

export default function PaymentsDebtorsPrintPage() {
  const navigate = useNavigate();
  const { activeRole, activeCampus } = useAuth();
  const campusesQuery = useCampusesQuery();
  const classroomsQuery = useClassroomsQuery();
  const secretaryMode = isSecretaryRole(activeRole);
  const secretaryCampus = secretaryMode && activeCampus !== "ALL" ? activeCampus : "";

  const [formFilters, setFormFilters] = useState({
    q: "",
    campus: activeCampus === "ALL" ? "" : activeCampus,
    level: "",
    grade: "",
    section: "",
    onlyOverdue: true,
  });
  const [appliedFilters, setAppliedFilters] = useState({
    q: "",
    campus: activeCampus === "ALL" ? "" : activeCampus,
    level: "",
    grade: "",
    section: "",
    onlyOverdue: true,
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printError, setPrintError] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [communicationTemplate, setCommunicationTemplate] = useState(DEFAULT_DEBTORS_COMMUNICATION_TEMPLATE);
  const isSearchMode = appliedFilters.q.trim().length >= 2;

  useEffect(() => {
    if (secretaryMode) {
      const campus = activeCampus === "ALL" ? "" : activeCampus;
      setFormFilters((prev) => ({ ...prev, campus }));
      setAppliedFilters((prev) => ({ ...prev, campus }));
    }
  }, [secretaryMode, activeCampus]);

  const campuses = useMemo(
    () => (Array.isArray(campusesQuery.data) ? campusesQuery.data : []),
    [campusesQuery.data],
  );

  const classrooms = useMemo(
    () => normalizeClassrooms(classroomsQuery.data),
    [classroomsQuery.data],
  );

  const campusScopedClassrooms = useMemo(() => {
    return classrooms.filter((classroom) => {
      if (!formFilters.campus) return true;
      const code = String(classroom?.campusCode || classroom?.campusAlias || "").toUpperCase();
      return !code || code === String(formFilters.campus).toUpperCase();
    });
  }, [classrooms, formFilters.campus]);

  const levelOptions = useMemo(() => {
    const values = new Set();
    campusScopedClassrooms.forEach((classroom) => {
      const level = String(classroom?.level || "").trim();
      if (level) values.add(level);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
  }, [campusScopedClassrooms]);

  const gradeOptions = useMemo(() => {
    const values = new Set();
    campusScopedClassrooms
      .filter((classroom) => !formFilters.level || String(classroom?.level || "") === String(formFilters.level))
      .forEach((classroom) => {
        const grade = String(classroom?.grade || "").trim();
        if (grade) values.add(grade);
      });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  }, [campusScopedClassrooms, formFilters.level]);

  const sectionOptions = useMemo(() => {
    const values = new Set();
    campusScopedClassrooms
      .filter((classroom) => !formFilters.level || String(classroom?.level || "") === String(formFilters.level))
      .filter((classroom) => !formFilters.grade || String(classroom?.grade || "") === String(formFilters.grade))
      .forEach((classroom) => {
        const section = String(classroom?.section || "").trim();
        if (section) values.add(section);
      });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
  }, [campusScopedClassrooms, formFilters.level, formFilters.grade]);

  const listQuery = usePaymentsDebtorsQuery(
    { campus: (secretaryCampus || appliedFilters.campus) || undefined, limit: 1000, onlyOverdue: appliedFilters.onlyOverdue },
    hasSearched && !isSearchMode,
    "list",
  );

  const searchQuery = usePaymentsDebtorsQuery(
    { q: appliedFilters.q.trim(), campus: (secretaryCampus || appliedFilters.campus) || undefined, limit: 1000 },
    hasSearched && isSearchMode,
    "search",
  );

  const activeQuery = isSearchMode ? searchQuery : listQuery;

  const rows = useMemo(
    () => (Array.isArray(activeQuery.data?.items) ? activeQuery.data.items : []).map(mapRow).filter((row) => row.id),
    [activeQuery.data],
  );

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (appliedFilters.onlyOverdue && Number(row.totalOverdue || 0) <= 0) return false;
      if (appliedFilters.level && String(row.level || "") !== String(appliedFilters.level)) return false;
      if (appliedFilters.grade && String(row.grade || "") !== String(appliedFilters.grade)) return false;
      if (appliedFilters.section && String(row.section || "") !== String(appliedFilters.section)) return false;
      return true;
    });
  }, [rows, appliedFilters.level, appliedFilters.grade, appliedFilters.section]);

  const currentCampusLabel = useMemo(() => {
    const campusCode = secretaryCampus || appliedFilters.campus || (activeCampus === "ALL" ? "Todos" : activeCampus) || "Todos";
    const campusRow = campuses.find((row) => String(row.code || "").toUpperCase() === String(campusCode).toUpperCase());
    return campusRow?.name || campusCode;
  }, [secretaryCampus, appliedFilters.campus, activeCampus, campuses]);

  const selectedCount = selectedIds.size;
  const allSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id));

  const handleToggleRow = (studentId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleToggleAllVisible = () => {
    setSelectedIds((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        visibleRows.forEach((row) => next.delete(row.id));
        return next;
      }

      const next = new Set(prev);
      visibleRows.forEach((row) => next.add(row.id));
      return next;
    });
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      ...formFilters,
      campus: secretaryCampus || formFilters.campus,
    });
    setHasSearched(true);
    setSelectedIds(new Set());
  };

  const buildFiltersPayload = () => ({
    q: appliedFilters.q || undefined,
    campus: (secretaryCampus || appliedFilters.campus) || undefined,
    onlyOverdue: appliedFilters.onlyOverdue,
  });

  const preparePrintPayload = async () => {
    const studentIds = Array.from(selectedIds);
    if (!studentIds.length) return null;

    setPrintError("");
    setIsPreparingPrint(true);
    try {
      return await fetchDebtorsForPrint({
        studentIds,
        filters: buildFiltersPayload(),
      });
    } catch (error) {
      setPrintError(getErrorMessage(error));
      return null;
    } finally {
      setIsPreparingPrint(false);
    }
  };

  const handlePrintList = async () => {
    const response = await preparePrintPayload();
    if (!response) return;

    const printKey = createDebtorsPrintStorageKey("payments-debtors-list");
    saveDebtorsPrintPayload(printKey, {
      generatedAt: response.generatedAt,
      items: response.items,
    });

    const previewUrl = `${ROUTES.dashboardPaymentsDebtorsPrintPreview}?printKey=${encodeURIComponent(printKey)}`;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrintLetters = async () => {
    const response = await preparePrintPayload();
    if (!response) return;

    const printKey = createDebtorsPrintStorageKey("payments-debtors-letters");
    saveDebtorsPrintPayload(printKey, {
      generatedAt: response.generatedAt,
      items: response.items,
      template: communicationTemplate,
    });

    const previewUrl = `${ROUTES.dashboardPaymentsDebtorsLettersPreview}?printKey=${encodeURIComponent(printKey)}`;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <OperationalContextBar
        items={[
          { key: "Campus", value: currentCampusLabel },
          { key: "Vista", value: "Deudores" },
          { key: "Visibles", value: `${visibleRows.length} alumnos`, icon: Users },
          { key: "Filtro", value: "Solo vencidos", icon: Filter, grow: true },
        ]}
        onBack={() => navigate(ROUTES.dashboardPayments)}
        backLabel="Volver a pagos"
      />

      <OperationalSearchBar>
        <div className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-3">
            <Input
              label="Buscar alumno"
              value={formFilters.q}
              onChange={(e) => setFormFilters((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="DNI, nombres, apellidos o codigo"
            />
          </div>

          {!secretaryMode ? (
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Campus</label>
              <select
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                value={formFilters.campus}
                onChange={(e) => setFormFilters((prev) => ({ ...prev, campus: e.target.value, level: "", grade: "", section: "" }))}
              >
                <option value="">Todos</option>
                {campuses.map((campus) => (
                  <option key={campus.id || campus.code} value={campus.code || ""}>
                    {campus.name || campus.code || "-"}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="md:col-span-2">
              <Input label="Campus" value={secretaryCampus || formFilters.campus} disabled />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Nivel</label>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={formFilters.level}
              onChange={(e) => setFormFilters((prev) => ({ ...prev, level: e.target.value, grade: "", section: "" }))}
            >
              <option value="">Todos</option>
              {levelOptions.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Grado</label>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={formFilters.grade}
              onChange={(e) => setFormFilters((prev) => ({ ...prev, grade: e.target.value, section: "" }))}
            >
              <option value="">Todos</option>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Sección</label>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={formFilters.section}
              onChange={(e) => setFormFilters((prev) => ({ ...prev, section: e.target.value }))}
            >
              <option value="">Todas</option>
              {sectionOptions.map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Filtro</label>
            <div className="inline-flex h-[42px] w-full items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-800">
              Solo vencidos
            </div>
          </div>

          <div className="md:col-span-1">
            <Button className="w-full" onClick={handleApplyFilters}>
              Buscar
            </Button>
          </div>
        </div>
      </OperationalSearchBar>

      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Comunicado</p>
            <h2 className="mt-1 text-base font-semibold text-gray-900">{communicationTemplate.title || "Comunicado de cobranza"}</h2>
            <p className="mt-1 line-clamp-2 max-w-3xl text-sm text-gray-600">
              {communicationTemplate.subject || communicationTemplate.body || "Sin contenido"}
            </p>
          </div>
          <SecondaryButton onClick={() => setTemplateOpen(true)}>Editar</SecondaryButton>
        </div>
      </div>

      {!hasSearched ? (
        <OperationalBlockState message="A la espera de busqueda. Define los filtros y presiona Buscar." minHeight="360px" />
      ) : activeQuery.isLoading ? (
        <OperationalBlockState message="Cargando deudores..." minHeight="360px" />
      ) : activeQuery.isError ? (
        <OperationalBlockState mode="error" message={getErrorMessage(activeQuery.error)} minHeight="360px" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Imprimir lista de deudores</h2>
                <p className="mt-1 text-sm text-gray-600">Selecciona alumnos con deuda vencida para imprimir una lista consolidada o comunicados personalizados.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Seleccionados: <span className="font-semibold">{selectedCount}</span>
              </div>
            </div>
          </div>

          <div className={`h-[29vh] overflow-auto ${activeQuery.isFetching ? "bg-gray-50/40" : ""}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" checked={allSelected} onChange={handleToggleAllVisible} aria-label="Seleccionar visibles" />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Alumno</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">DNI</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Código</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Campus</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Nivel</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Grado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Sección</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Pendiente</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Vencido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {visibleRows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleToggleRow(row.id)}
                          aria-label={`Seleccionar ${row.fullName}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-900">{row.fullName}</td>
                      <td className="px-4 py-3 text-gray-700">{row.dni}</td>
                      <td className="px-4 py-3 text-gray-700">{row.code}</td>
                      <td className="px-4 py-3 text-gray-700">{row.campus}</td>
                      <td className="px-4 py-3 text-gray-700">{row.level || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{row.grade || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{row.section || "-"}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(row.totalPending)}</td>
                      <td className="px-4 py-3 font-medium text-amber-700">{formatMoney(row.totalOverdue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!visibleRows.length ? (
            <div className="border-t border-gray-200 px-4 py-6 text-sm text-gray-500">
              {appliedFilters.q ? "No se encontraron alumnos para esa búsqueda." : "No hay deudores para los filtros seleccionados."}
            </div>
          ) : null}

          {printError ? <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{printError}</div> : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-4 py-3">
            <SecondaryButton onClick={() => setSelectedIds(new Set())} disabled={!selectedIds.size || isPreparingPrint}>Limpiar selección</SecondaryButton>
            <Button onClick={handlePrintList} disabled={!selectedIds.size || isPreparingPrint}>
              {isPreparingPrint ? "Preparando..." : "Imprimir lista"}
            </Button>
            <Button onClick={handlePrintLetters} disabled={!selectedIds.size || isPreparingPrint}>
              {isPreparingPrint ? "Preparando..." : "Imprimir comunicados"}
            </Button>
          </div>
        </div>
      )}

      <DebtorsCommunicationTemplateModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        initialTemplate={communicationTemplate}
        onSave={(nextTemplate) => {
          setCommunicationTemplate(nextTemplate);
          setTemplateOpen(false);
        }}
      />
    </div>
  );
}
