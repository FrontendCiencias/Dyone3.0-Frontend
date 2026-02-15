import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { normalizeSearchText } from "../../students/domain/searchText";
import { usePaymentsDebtorsQuery } from "../hooks/usePaymentsDebtorsQuery";
import RegisterPaymentModal from "../components/RegisterPaymentModal";
import { useClipboard } from "../../../shared/hooks/useClipboard";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo cargar la caja.";
}

function resolveCampusAlias(activeRole) {
  const role = String(activeRole || "").toUpperCase();
  if (role.includes("CIMAS")) return "CIMAS";
  if (role.includes("CIENCIAS_APLICADAS") || role.includes("CIENCIAS_PRIM")) return "CIENCIAS_APLICADAS";
  if (role.includes("CIENCIAS")) return "CIENCIAS";
  return "";
}

function isSecretaryRole(activeRole) {
  return String(activeRole || "").toUpperCase().startsWith("SECRETARY");
}

function mapDebtor(item, index) {
  const student = item?.student || item;
  return {
    id: student?.id || student?._id || item?.studentId,
    names: student?.names,
    lastNames: student?.lastNames,
    dni: student?.dni,
    code: student?.code || student?.internalCode,
    campus: student?.campusCode || item?.campusCode || item?.campus || "",
    pendingTotal: Number(item?.pendingTotal ?? item?.totalPending ?? item?.debtTotal ?? 0),
    overdueTotal: Number(item?.overdueTotal ?? item?.totalOverdue ?? 0),
    lastPaymentDate: item?.lastPaymentDate || item?.lastPayment?.date || null,
    _index: index,
  };
}

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState(resolveCampusAlias(activeRole));
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const { copied, copy } = useClipboard();

  const secretaryMode = isSecretaryRole(activeRole);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (secretaryMode) {
      setCampusFilter(resolveCampusAlias(activeRole));
    }
  }, [activeRole, secretaryMode]);

  const debtorsQuery = usePaymentsDebtorsQuery(
    { q: debouncedSearch, campus: campusFilter || undefined, limit: 100 },
    true,
  );

  const rawDebtors = useMemo(() => {
    const rows = Array.isArray(debtorsQuery.data?.items) ? debtorsQuery.data.items : [];
    return rows.map((item, index) => mapDebtor(item, index)).filter((row) => row.id);
  }, [debtorsQuery.data]);

  const secretaryCampusSupportMissing = useMemo(() => {
    if (!secretaryMode || !campusFilter || !rawDebtors.length) return false;
    const hasCampusField = rawDebtors.some((row) => Boolean(row.campus));
    if (!hasCampusField) return true;
    return false;
  }, [secretaryMode, campusFilter, rawDebtors]);

  const debtors = useMemo(() => {
    let rows = rawDebtors;

    if (secretaryMode && campusFilter && rows.some((row) => row.campus)) {
      rows = rows.filter((row) => String(row.campus || "").toUpperCase() === String(campusFilter).toUpperCase());
    }

    if (debouncedSearch) {
      const normalized = normalizeSearchText(debouncedSearch);
      rows = rows.filter((row) =>
        [row.dni, row.code, row.names, row.lastNames]
          .filter(Boolean)
          .some((value) => normalizeSearchText(value).includes(normalized)),
      );
    }

    if (onlyOverdue) {
      rows = rows.filter((row) => row.overdueTotal > 0);
    }

    return [...rows].sort((a, b) => {
      if (b.overdueTotal !== a.overdueTotal) return b.overdueTotal - a.overdueTotal;
      if (b.pendingTotal !== a.pendingTotal) return b.pendingTotal - a.pendingTotal;
      return a._index - b._index;
    });
  }, [rawDebtors, secretaryMode, campusFilter, debouncedSearch, onlyOverdue]);

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Caja</h1>
        <p className="mt-1 text-sm text-gray-600">Gestiona deudores y registra pagos diarios.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <Input label="Buscar deudor" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="DNI, código o nombre" />
          </div>

          {!secretaryMode && (
            <div className="md:col-span-3">
              <Input
                label="Campus"
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                placeholder="CIMAS / CIENCIAS..."
              />
            </div>
          )}

          {secretaryMode && (
            <div className="md:col-span-3">
              <Input label="Campus" value={campusFilter} disabled />
            </div>
          )}

          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Vencidos</label>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={onlyOverdue}
              onChange={(e) => setOnlyOverdue(e.target.checked)}
            />
          </div>

          <div className="md:col-span-2">
            <SecondaryButton className="w-full" onClick={() => { setSelectedStudent(null); setPaymentModalOpen(true); }}>
              Registrar pago
            </SecondaryButton>
          </div>
        </div>
      </Card>

      {secretaryCampusSupportMissing && (
        <Card className="border border-amber-200 bg-amber-50 text-sm text-amber-800">
          Pendiente soporte backend para filtrar deudores por campus.
        </Card>
      )}

      {debtorsQuery.isError && (
        <Card className="border border-red-100 text-sm text-red-700">{getErrorMessage(debtorsQuery.error)}</Card>
      )}

      {debtorsQuery.isLoading || debtorsQuery.isFetching ? (
        <Card className="border border-gray-200 text-sm text-gray-500">Cargando deudores...</Card>
      ) : (
        <div className="space-y-3">
          {debtors.map((row) => (
            <Card key={row.id} className="border border-gray-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-gray-900">{row.lastNames}, {row.names}</p>
                  <p className="text-sm text-gray-600">DNI: {row.dni || "-"} · Código: {row.code || "-"}</p>
                  <p className="text-sm text-gray-600">
                    Pendiente: {formatMoney(row.pendingTotal)} · Vencido: {formatMoney(row.overdueTotal)} · Último pago: {row.lastPaymentDate ? String(row.lastPaymentDate).slice(0, 10) : "-"}
                  </p>
                  <div className="mt-1 flex gap-2">
                    <SecondaryButton className="px-2 py-1 text-xs" onClick={() => copy(row.dni || "")}>{copied ? "Copiado" : "Copiar DNI"}</SecondaryButton>
                    <SecondaryButton className="px-2 py-1 text-xs" onClick={() => copy(row.code || "")}>{copied ? "Copiado" : "Copiar código"}</SecondaryButton>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => { setSelectedStudent(row); setPaymentModalOpen(true); }}>
                    Registrar pago
                  </SecondaryButton>
                  <Button onClick={() => navigate(ROUTES.dashboardStudentDetail(row.id))}>Abrir expediente</Button>
                </div>
              </div>
            </Card>
          ))}

          {!debtors.length && (
            <Card className="border border-gray-200 text-sm text-gray-500">No hay deudores para los filtros seleccionados.</Card>
          )}
        </div>
      )}

      <RegisterPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        fixedStudent={selectedStudent}
        title="Registrar pago"
      />
    </div>
  );
}
