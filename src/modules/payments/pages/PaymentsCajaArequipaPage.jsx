import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, CheckCircle2, FileSearch, FileUp, Landmark, Link2, LoaderCircle, RefreshCw, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import BaseModal from "../../../shared/ui/BaseModal";
import OperationalBlockState from "../../../shared/ui/OperationalBlockState";
import OperationalContextBar from "../../../shared/ui/OperationalContextBar";
import OperationalDataTable from "../../../shared/ui/OperationalDataTable";
import OperationalSummaryCard from "../../../shared/ui/OperationalSummaryCard";
import { getOperationalDefaultSort, sortOperationalData } from "../../../shared/ui/operationalDataTableSort";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useCampusesQuery } from "../../admin/hooks/useCampusesQuery";
import { searchStudentsAutocomplete, updateStudentBankCode } from "../../students/services/students.service";
import { useCajaArequipaReviewQuery } from "../hooks/useCajaArequipaReviewQuery";
import { useConfirmCajaArequipaImportMutation } from "../hooks/useConfirmCajaArequipaImportMutation";
import { useProcessCajaArequipaMutation } from "../hooks/useProcessCajaArequipaMutation";
import { createCajaArequipaPrintStorageKey, saveCajaArequipaPrintPayload } from "../utils/cajaArequipaPrintStorage";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(date);
}

function getStudentDisplayName(student) {
  const names = String(student?.personId?.names || "").trim();
  const lastNames = String(student?.personId?.lastNames || "").trim();
  return `${lastNames} ${names}`.trim() || "Sin nombre";
}

function getErrorMessage(error, fallback) {
  const message = error?.response?.data?.message || error?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return fallback;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

function translateStatus(status) {
  const map = {
    READY_TO_IMPORT: { label: "Listo", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    DUPLICATE: { label: "Duplicado", className: "border-gray-200 bg-gray-100 text-gray-700" },
    PAYMENT_WEB: { label: "Pago web", className: "border-sky-200 bg-sky-50 text-sky-700" },
    MANUAL_REVIEW: { label: "Revision manual", className: "border-amber-200 bg-amber-50 text-amber-700" },
    STUDENT_NOT_FOUND: { label: "Alumno no encontrado", className: "border-rose-200 bg-rose-50 text-rose-700" },
    CHARGE_NOT_FOUND: { label: "Cargo no encontrado", className: "border-rose-200 bg-rose-50 text-rose-700" },
    IMPORTED: { label: "Importado", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  };
  return map[String(status || "").toUpperCase()] || { label: status || "-", className: "border-gray-200 bg-gray-100 text-gray-700" };
}

export default function PaymentsCajaArequipaPage() {
  const navigate = useNavigate();
  const { activeRole, activeCampus } = useAuth();
  const campusesQuery = useCampusesQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const importId = searchParams.get("importId") || "";
  const [selectedCampus, setSelectedCampus] = useState(activeCampus === "ALL" ? "" : activeCampus);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [linkModalRow, setLinkModalRow] = useState(null);
  const [linkSearchTerm, setLinkSearchTerm] = useState("");
  const [linkDebouncedTerm, setLinkDebouncedTerm] = useState("");
  const [linkResults, setLinkResults] = useState([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSearchError, setLinkSearchError] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [linkingBankCode, setLinkingBankCode] = useState(false);

  const secretaryMode = String(activeRole || "").toUpperCase().startsWith("SECRETARY");
  const reviewQuery = useCajaArequipaReviewQuery(importId, Boolean(importId));
  const processMutation = useProcessCajaArequipaMutation();
  const confirmMutation = useConfirmCajaArequipaImportMutation(importId);

  const campuses = useMemo(() => {
    const raw = Array.isArray(campusesQuery.data) ? campusesQuery.data : [];
    return raw
      .map((row) => ({ code: String(row.code || "").toUpperCase(), name: row.name || row.code || "" }))
      .filter((row) => row.code);
  }, [campusesQuery.data]);

  useEffect(() => {
    if (secretaryMode && activeCampus !== "ALL") {
      setSelectedCampus(activeCampus);
    }
  }, [secretaryMode, activeCampus]);

  useEffect(() => {
    if (!linkModalRow) {
      setLinkDebouncedTerm("");
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setLinkDebouncedTerm(String(linkSearchTerm || "").trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [linkModalRow, linkSearchTerm]);

  useEffect(() => {
    if (!linkModalRow) return undefined;

    const query = String(linkDebouncedTerm || "").trim();
    if (query.length < 2) {
      setLinkResults([]);
      setLinkLoading(false);
      setLinkSearchError("");
      return undefined;
    }

    let cancelled = false;
    setLinkLoading(true);
    setLinkSearchError("");

    searchStudentsAutocomplete({ q: query, limit: 12 })
      .then((items) => {
        if (cancelled) return;
        setLinkResults(Array.isArray(items) ? items : []);
      })
      .catch((error) => {
        if (cancelled) return;
        setLinkResults([]);
        setLinkSearchError(getErrorMessage(error, "No se pudo buscar alumnos."));
      })
      .finally(() => {
        if (!cancelled) setLinkLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [linkModalRow, linkDebouncedTerm]);

  const currentCampusLabel = useMemo(() => {
    const target = campuses.find((row) => row.code === selectedCampus);
    return target?.name || selectedCampus || (activeCampus === "ALL" ? "Todos" : activeCampus) || "Sin definir";
  }, [campuses, selectedCampus, activeCampus]);

  const review = reviewQuery.data || null;
  const rows = Array.isArray(review?.rows) ? review.rows : [];
  const summary = review?.summary || {};
  const canConfirm = Number(summary.readyToImport || 0) > 0 && review?.status !== "CONFIRMED";
  const reviewColumns = useMemo(
    () => [
      {
        key: "status",
        header: "Estado",
        accessor: (row) => translateStatus(row.reviewStatus).label,
        sortType: "string",
        render: (row) => {
          const status = translateStatus(row.reviewStatus);
          return String(row.reviewStatus || "").toUpperCase() === "STUDENT_NOT_FOUND" ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openLinkStudentModal(row);
              }}
              className="inline-flex flex-col items-start rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-left transition-colors hover:border-rose-300 hover:bg-rose-100"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700">Alumno no encontrado</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-rose-800">
                <Link2 className="h-3.5 w-3.5" />
                Vincular codigo
              </span>
            </button>
          ) : (
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${status.className}`}>
              {status.label}
            </span>
          );
        },
      },
      { key: "paidAt", header: "Fecha", accessor: (row) => row.paidAt || null, sortType: "date", render: (row) => formatDate(row.paidAt) },
      { key: "bankCode", header: "Codigo CA", accessor: (row) => row.bankCode || "-", sortType: "string", cellClassName: "font-medium text-gray-900" },
      { key: "pdfStudentName", header: "Alumno PDF", accessor: (row) => row.pdfStudentName || "-", sortType: "string" },
      {
        key: "studentFullName",
        header: "Alumno web",
        accessor: (row) => row.studentFullName || "-",
        sortType: "string",
        render: (row) => (
          <>
            {row.studentFullName || "-"}
            {row.studentCode ? <div className="text-xs text-gray-500">{row.studentCode}</div> : null}
          </>
        ),
      },
      { key: "subperiod", header: "Subperiodo", accessor: (row) => row.subperiod || "-", sortType: "string" },
      { key: "monthLabel", header: "Mes", accessor: (row) => row.monthLabel || "-", sortType: "string" },
      { key: "expectedTuitionAmount", header: "Pension web", accessor: (row) => Number(row.expectedTuitionAmount || 0), sortType: "number", render: (row) => formatMoney(row.expectedTuitionAmount || 0) },
      { key: "reportedAmount", header: "Total PDF", accessor: (row) => Number(row.reportedAmount || 0), sortType: "number", cellClassName: "text-gray-900", render: (row) => formatMoney(row.reportedAmount || 0) },
      { key: "commissionAmount", header: "Comision", accessor: (row) => Number(row.commissionAmount || 0), sortType: "number", render: (row) => formatMoney(row.commissionAmount || 0) },
      { key: "moraAmount", header: "Mora", accessor: (row) => Number(row.moraAmount || 0), sortType: "number", render: (row) => formatMoney(row.moraAmount || 0) },
      { key: "establishment", header: "Establecimiento", accessor: (row) => row.establishment || "Pago web", sortType: "string" },
      { key: "observation", header: "Observacion", accessor: (row) => row.observation || "-", sortType: "string", cellClassName: "min-w-[280px]" },
    ],
    [],
  );
  const [reviewSortState, setReviewSortState] = useState(() => getOperationalDefaultSort(reviewColumns));
  const sortedReviewRows = useMemo(
    () => sortOperationalData(rows, reviewColumns, reviewSortState),
    [rows, reviewColumns, reviewSortState],
  );
  const selectedStudent = useMemo(
    () => linkResults.find((item) => String(item._id) === String(selectedStudentId)) || null,
    [linkResults, selectedStudentId]
  );

  function resetLinkStudentModal() {
    setLinkModalRow(null);
    setLinkSearchTerm("");
    setLinkDebouncedTerm("");
    setLinkResults([]);
    setLinkSearchError("");
    setSelectedStudentId("");
  }

  function openLinkStudentModal(row) {
    setLinkModalRow(row);
    setLinkSearchTerm("");
    setLinkDebouncedTerm("");
    setLinkResults([]);
    setLinkSearchError("");
    setSelectedStudentId("");
  }

  function closeLinkStudentModal() {
    if (linkingBankCode) return;
    resetLinkStudentModal();
  }

  const handleProcess = async () => {
    setLocalError("");
    setSuccessMessage("");

    if (!selectedFile) {
      setLocalError("Selecciona un PDF de Caja Arequipa antes de procesar.");
      return;
    }

    if (!selectedCampus) {
      setLocalError("Debes definir el campus a revisar.");
      return;
    }

    try {
      const pdfBase64 = await readFileAsBase64(selectedFile);
      const result = await processMutation.mutateAsync({
        campus: selectedCampus,
        fileName: selectedFile.name,
        pdfBase64,
      });
      setSearchParams(result?.importId ? { importId: result.importId } : {});
    } catch (error) {
      setLocalError(getErrorMessage(error, "No se pudo procesar el PDF de Caja Arequipa."));
    }
  };

  const handleConfirm = async () => {
    setLocalError("");
    setSuccessMessage("");
    try {
      const result = await confirmMutation.mutateAsync();
      setSuccessMessage(`Importacion completada: ${result.imported || 0} pago(s) creados.`);
      await reviewQuery.refetch();
    } catch (error) {
      setLocalError(getErrorMessage(error, "No se pudo confirmar la importacion."));
    }
  };

  const handlePrintReview = () => {
    if (!review) return;
    const printKey = createCajaArequipaPrintStorageKey();
    saveCajaArequipaPrintPayload(printKey, {
      generatedAt: new Date().toISOString(),
      importId: review.importId,
      campusLabel: currentCampusLabel,
      items: sortedReviewRows.map((row) => ({
        ...row,
        statusLabel: translateStatus(row.reviewStatus).label,
      })),
    });

    const previewUrl = `${ROUTES.dashboardPaymentsCajaArequipaPrintPreview}?printKey=${encodeURIComponent(printKey)}`;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const handleLinkBankCode = async () => {
    if (!linkModalRow?.bankCode) {
      setLinkSearchError("La fila seleccionada no tiene codigo Caja Arequipa.");
      return;
    }
    if (!selectedStudent) {
      setLinkSearchError("Selecciona un alumno antes de vincular el codigo.");
      return;
    }

    setLinkingBankCode(true);
    setLinkSearchError("");

    try {
      await updateStudentBankCode(selectedStudent._id, linkModalRow.bankCode);
      setSuccessMessage(`Codigo ${linkModalRow.bankCode} vinculado a ${getStudentDisplayName(selectedStudent)}.`);
      resetLinkStudentModal();
      await reviewQuery.refetch();
    } catch (error) {
      setLinkSearchError(getErrorMessage(error, "No se pudo vincular el codigo Caja Arequipa."));
    } finally {
      setLinkingBankCode(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <OperationalContextBar
        items={[
          { key: "Campus", value: currentCampusLabel },
          { key: "Vista", value: "Caja Arequipa" },
          { key: "Importacion", value: importId ? `Revision ${importId.slice(-6).toUpperCase()}` : "Nueva carga", grow: true },
        ]}
        onBack={() => navigate(ROUTES.dashboardPayments)}
        backLabel="Volver a pagos"
      />

      {localError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {localError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          {!secretaryMode ? (
            <div className="lg:col-span-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">Campus</label>
              <select
                value={selectedCampus}
                onChange={(event) => setSelectedCampus(event.target.value)}
                className="h-[42px] w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-800 outline-none transition focus:border-gray-500"
              >
                <option value="">Selecciona un campus</option>
                {campuses.map((campus) => (
                  <option key={campus.code} value={campus.code}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="lg:col-span-3">
              <Input label="Campus" value={selectedCampus} disabled />
            </div>
          )}

          <div className="lg:col-span-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">PDF de Caja Arequipa</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              className="block h-[42px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-gray-700"
            />
          </div>

          <div className="lg:col-span-3">
            <Button
              className="h-[42px] w-full rounded-xl"
              onClick={handleProcess}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Procesando...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <FileUp className="h-4 w-4" />
                  Procesar PDF
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {review ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <OperationalSummaryCard
              label="Procesadas"
              value={String(summary.processedRows || 0)}
              hint="Filas detectadas en el PDF"
              icon={FileUp}
              variant="neutral"
            />
            <OperationalSummaryCard
              label="Listas"
              value={String(summary.readyToImport || 0)}
              hint="Pagos aptos para importar"
              icon={CheckCircle2}
              variant="green"
            />
            <OperationalSummaryCard
              label="Duplicadas"
              value={String(summary.duplicated || 0)}
              hint="Filas ya importadas o repetidas"
              icon={RefreshCw}
              variant="amber"
            />
            <OperationalSummaryCard
              label="Comision"
              value={formatMoney(summary.totalCommissionAmount || 0)}
              hint={`Mora detectada: ${formatMoney(summary.totalMoraAmount || 0)}`}
              icon={Landmark}
              variant="blue"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Revision previa</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Se clasifican solo pagos de pensiones. La comision y la mora se muestran aparte y no se cargan como monto base.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <SecondaryButton onClick={handlePrintReview}>Imprimir lista</SecondaryButton>
                  <Button onClick={handleConfirm} disabled={!canConfirm || confirmMutation.isPending}>
                    {confirmMutation.isPending ? "Confirmando..." : "Confirmar importacion"}
                  </Button>
                </div>
              </div>
            </div>

            {review.status === "FAILED" ? (
              <OperationalBlockState
                mode="error"
                minHeight="220px"
                message={review.errorMessage || "No se pudo construir la revision de Caja Arequipa."}
              />
            ) : (
              <div className="h-[45vh] overflow-auto">
                <OperationalDataTable
                  columns={reviewColumns}
                  data={rows}
                  sortState={reviewSortState}
                  onSortChange={setReviewSortState}
                  rowKey={(row) => `${row.rowIndex}-${row.fingerprint}`}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <OperationalBlockState
          mode={processMutation.isPending || reviewQuery.isFetching ? "loading" : "empty"}
          minHeight="220px"
          message={
            processMutation.isPending || reviewQuery.isFetching
              ? "Procesando PDF de Caja Arequipa..."
              : "Sube un PDF de Caja Arequipa para procesarlo y revisar que pagos pueden importarse."
          }
        />
      )}

      <BaseModal
        open={Boolean(linkModalRow)}
        onClose={closeLinkStudentModal}
        title="Vincular codigo Caja Arequipa"
        maxWidthClass="max-w-3xl"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Si el alumno ya tiene codigo actual, ese codigo se guardara como historico y el nuevo quedara como principal.
            </p>
            <div className="flex items-center justify-end gap-2">
              <SecondaryButton onClick={closeLinkStudentModal} disabled={linkingBankCode}>
                Cancelar
              </SecondaryButton>
              <Button onClick={handleLinkBankCode} disabled={!selectedStudent || linkingBankCode}>
                {linkingBankCode ? "Vinculando..." : "Guardar vinculo"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            <div className="font-semibold text-sky-900">Fila pendiente de vinculacion</div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span><strong>Codigo CA:</strong> {linkModalRow?.bankCode || "-"}</span>
              <span><strong>Alumno PDF:</strong> {linkModalRow?.pdfStudentName || "-"}</span>
              <span><strong>Campus:</strong> {currentCampusLabel}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Buscar alumno en la web</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={linkSearchTerm}
                  onChange={(event) => {
                    setLinkSearchTerm(event.target.value);
                    setSelectedStudentId("");
                  }}
                  placeholder="Busca por nombres, apellidos, DNI, codigo interno o codigo CA"
                  className="h-[42px] w-full rounded-xl border border-gray-300 pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-gray-500"
                />
              </div>
              <div className="flex h-[42px] min-w-[180px] items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-600">
                {linkLoading ? "Buscando..." : "Escribe al menos 2 caracteres"}
              </div>
            </div>
          </div>

          {linkSearchError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {linkSearchError}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Resultados</h3>
              <p className="mt-1 text-xs text-gray-500">
                Puedes seleccionar un alumno sin codigo o actualizar el codigo principal de uno que ya tenga codigo Caja Arequipa.
              </p>
            </div>

            <div className="max-h-[46vh] overflow-auto">
              {linkLoading ? (
                <div className="flex min-h-[180px] items-center justify-center gap-2 text-sm text-gray-500">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Buscando alumnos...
                </div>
              ) : linkDebouncedTerm.trim().length < 2 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-gray-500">
                  <FileSearch className="h-5 w-5 text-gray-400" />
                  Busca un alumno para asignarle el codigo {linkModalRow?.bankCode || "-"}.
                </div>
              ) : !linkResults.length ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-gray-500">
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                  No encontramos alumnos con esa busqueda.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {linkResults.map((student) => {
                    const alreadyHasCode = Boolean(student.bankCode);
                    const isSelected = String(student._id) === String(selectedStudentId);
                    return (
                      <button
                        key={student._id}
                        type="button"
                        onClick={() => setSelectedStudentId(String(student._id))}
                        className={[
                          "flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors",
                          isSelected ? "bg-sky-50" : "bg-white hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900">{getStudentDisplayName(student)}</div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span><strong>DNI:</strong> {student?.personId?.dni || "-"}</span>
                              <span><strong>Cod. interno:</strong> {student?.internalCode || "-"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {alreadyHasCode ? (
                              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                                Actual CA: {student.bankCode}
                              </span>
                            ) : isSelected ? (
                              <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                                Seleccionado
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                Disponible
                              </span>
                            )}
                          </div>
                        </div>
                        {alreadyHasCode ? (
                          <div className="text-xs text-amber-700">
                            Si lo eliges, el codigo actual se movera a historicos y el codigo del PDF quedara como principal.
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
