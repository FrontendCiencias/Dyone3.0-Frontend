import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Clock3, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import OperationalContextBar from "../../../shared/ui/OperationalContextBar";
import OperationalSummaryCard from "../../../shared/ui/OperationalSummaryCard";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useAuth } from "../../../lib/auth";
import { CAPABILITIES, hasCapability } from "../../auth/utils/capabilities";
import { useBillingConceptsQuery } from "../../admin/hooks/useBillingConceptsQuery";
import CreateChargeModal from "../../students/components/detail/modals/CreateChargeModal";
import { useCreateStudentChargeMutation } from "../../students/hooks/useCreateStudentChargeMutation";
import { useDeleteStudentChargeMutation } from "../../students/hooks/useDeleteStudentChargeMutation";
import { useUpdateStudentChargeMutation } from "../../students/hooks/useUpdateStudentChargeMutation";
import { ROUTES } from "../../../config/routes";
import { useStudentAccountStatementQuery } from "../hooks/useStudentAccountStatementQuery";
import PaymentAllocationDrawer from "../components/PaymentAllocationDrawer";
import PaymentDetailModal from "../components/PaymentDetailModal";
import EditChargeModal from "../components/EditChargeModal";
import CorrectPaymentReceiptModal from "../components/CorrectPaymentReceiptModal";
import { useUpdatePaymentReceiptMutation } from "../hooks/useUpdatePaymentReceiptMutation";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatMethod(value) {
  if (value === "CASH") return "Efectivo";
  if (value === "YAPE") return "Yape";
  if (value === "TRANSFER") return "Transferencia";
  if (value === "CAJA_AREQUIPA") return "Caja Arequipa";
  return value || "-";
}

function formatChargeStatus(value) {
  if (value === "PAID") return "COMPLETO";
  if (value === "PARTIAL") return "PARCIAL";
  if (value === "PENDING") return "PENDIENTE";
  if (value === "OVERDUE") return "VENCIDO";
  if (value === "CANCELLED") return "CANCELADO";
  return value || "-";
}

function chargeRowClassName(status, isSelected) {
  if (isSelected) return "bg-blue-50";
  if (status === "OVERDUE") return "bg-rose-50/80";
  return "";
}

function chargeStatusClassName(status) {
  const base = "text-[11px] font-medium uppercase tracking-[0.18em]";
  if (status === "OVERDUE") return `${base} text-rose-700`;
  if (status === "PAID") return `${base} text-emerald-700`;
  if (status === "PENDING") return `${base} text-slate-600`;
  if (status === "PARTIAL") return `${base} text-amber-700`;
  if (status === "CANCELLED") return `${base} text-slate-400`;
  return `${base} text-slate-600`;
}

function formatContextValue(value) {
  const normalized = String(value || "").trim();
  return normalized || "-";
}

function isObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || "").trim());
}

const initialChargeForm = {
  billingConceptId: "",
  amount: "",
  hasDueDate: false,
  dueDate: "",
  observation: "",
};

export default function PaymentStudentDetailPage() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { activeRole } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCharges, setSelectedCharges] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [correctPaymentOpen, setCorrectPaymentOpen] = useState(false);
  const [createChargeOpen, setCreateChargeOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);
  const [chargeForm, setChargeForm] = useState(initialChargeForm);
  const accountQuery = useStudentAccountStatementQuery(studentId, true);
  const billingConceptsQuery = useBillingConceptsQuery();
  const createChargeMutation = useCreateStudentChargeMutation(studentId);
  const updateChargeMutation = useUpdateStudentChargeMutation(studentId);
  const deleteChargeMutation = useDeleteStudentChargeMutation(studentId);
  const updatePaymentReceiptMutation = useUpdatePaymentReceiptMutation(studentId);

  const account = accountQuery.data || {};
  const charges = Array.isArray(account.charges) ? account.charges : [];
  const payments = Array.isArray(account.payments) ? account.payments : [];
  const student = useMemo(() => account.student || {}, [account.student]);
  const billingConcepts = useMemo(() => {
    const rows = Array.isArray(billingConceptsQuery.data)
      ? billingConceptsQuery.data
      : Array.isArray(billingConceptsQuery.data?.items)
        ? billingConceptsQuery.data.items
        : [];

    return rows;
  }, [billingConceptsQuery.data]);

  const selectedChargeRows = useMemo(
    () => charges.filter((charge) => selectedCharges[charge.id] !== undefined),
    [charges, selectedCharges],
  );
  const showDrawer = drawerOpen && selectedChargeRows.length > 0;
  const canCorrectReceipt = hasCapability(activeRole, CAPABILITIES.paymentsCorrectReceipt);
  const canEditReceiptAmount = hasCapability(activeRole, CAPABILITIES.paymentsEditReceiptAmount);
  const canEditReceiptPaidAt = hasCapability(activeRole, CAPABILITIES.paymentsEditReceiptPaidAt);
  const canReassignReceipt = hasCapability(activeRole, CAPABILITIES.paymentsReassignReceipt);

  const topSummaryBlock = (
    <div className="space-y-3">
      <OperationalContextBar
        items={[
          { key: "Cod. interno", value: formatContextValue(student?.internalCode || student?.code) },
          { key: "Cod. Caja", value: formatContextValue(student?.bankCode) },
          {
            key: "Grado actual",
            value: formatContextValue(student?.gradeDisplayName || student?.classroomDisplayName),
            grow: true,
          },
        ]}
        onBack={() => navigate(ROUTES.dashboardPayments)}
        backLabel="Volver a pagos"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationalSummaryCard
          label="Pendiente"
          value={formatMoney(account?.totals?.pending)}
          icon={Clock3}
          variant="neutral"
        />
        <OperationalSummaryCard
          label="Vencido"
          value={formatMoney(account?.totals?.overdue)}
          icon={AlertCircle}
          variant="amber"
        />
        <OperationalSummaryCard
          label="Pagado"
          value={formatMoney(account?.totals?.paid)}
          icon={CheckCircle}
          variant="green"
        />
        <OperationalSummaryCard
          label="Crear cargo"
          value="Nuevo cargo"
          hint="Registrar concepto de cobro"
          icon={Plus}
          variant="blue"
          actionLabel="Agregar"
          onAction={() => setCreateChargeOpen(true)}
          className="min-h-[9vh]"
        />
      </div>
    </div>
  );

  useEffect(() => {
    if (!selectedChargeRows.length) {
      setDrawerOpen(false);
    }
  }, [selectedChargeRows.length]);

  const toggleCharge = (charge) => {
    setSelectedCharges((prev) => {
      const next = { ...prev };
      if (next[charge.id] !== undefined) {
        delete next[charge.id];
      } else {
        next[charge.id] = Number(charge.outstandingAmount || 0);
      }
      return next;
    });
    setDrawerOpen(true);
  };

  const updateChargeAmount = (chargeId, value) => {
    setSelectedCharges((prev) => ({
      ...prev,
      [chargeId]: value,
    }));
  };

  const removeCharge = (chargeId) => {
    setSelectedCharges((prev) => {
      const next = { ...prev };
      delete next[chargeId];
      return next;
    });
  };

  const resetSelection = (shouldRefresh = false) => {
    setDrawerOpen(false);
    setSelectedCharges({});
    if (shouldRefresh) {
      accountQuery.refetch();
    }
  };

  const handleCreateCharge = async () => {
    const amount = Number(chargeForm.amount);
    if (!chargeForm.billingConceptId || Number.isNaN(amount) || amount <= 0) return;
    if (chargeForm.hasDueDate && !chargeForm.dueDate) return;

    const selectedConcept = billingConcepts.find((concept) => {
      const conceptValue = String(concept?.id || concept?._id || concept?.code || concept?.name || "").trim();
      return conceptValue === String(chargeForm.billingConceptId || "").trim();
    });

    const selectedBillingConceptId = String(selectedConcept?.id || selectedConcept?._id || "").trim();
    const selectedConceptName = String(selectedConcept?.name || selectedConcept?.code || chargeForm.billingConceptId || "").trim();

    await createChargeMutation.mutateAsync({
      studentId,
      ...(isObjectId(selectedBillingConceptId)
        ? { billingConceptId: selectedBillingConceptId }
        : { conceptName: selectedConceptName }),
      amount,
      dueDate: chargeForm.hasDueDate ? chargeForm.dueDate : undefined,
      observation: chargeForm.observation.trim() || undefined,
    });
  };

  const handleEditCharge = async (formValues) => {
    const amount = Number(formValues?.amount);
    if (!editingCharge?.id || Number.isNaN(amount) || amount <= 0) return;

    await updateChargeMutation.mutateAsync({
      chargeId: editingCharge.id,
      payload: {
        amount,
        dueDate: String(formValues?.dueDate || "").trim() || undefined,
      },
    });
  };

  const handleDeleteCharge = async () => {
    if (!editingCharge?.id) return;

    await deleteChargeMutation.mutateAsync({
      chargeId: editingCharge.id,
    });
  };

  const handleCorrectPayment = async (formValues) => {
    if (!selectedPayment?.id) return;

    const updated = await updatePaymentReceiptMutation.mutateAsync({
      paymentId: selectedPayment.id,
      payload: {
        method: formValues.method,
        amount: canEditReceiptAmount ? Number(formValues.amount || 0) || undefined : undefined,
        paidAt: canEditReceiptPaidAt ? String(formValues.paidAt || "").trim() || undefined : undefined,
        receiptNumber: String(formValues.receiptNumber || "").trim() || undefined,
        voucherNumber: String(formValues.voucherNumber || "").trim() || undefined,
        notes: String(formValues.notes || "").trim() || undefined,
        correctionReason: String(formValues.correctionReason || "").trim(),
        reassignStudentId: String(formValues.reassignStudentId || "").trim() || undefined,
        reassignAllocations: Array.isArray(formValues.reassignAllocations) ? formValues.reassignAllocations : undefined,
      },
    });

    setSelectedPayment((prev) => ({
      ...(prev || {}),
      method: updated?.method || formValues.method,
      amount: Number(updated?.amount ?? updated?.totalAmount ?? (canEditReceiptAmount ? Number(formValues.amount || 0) || prev?.amount : prev?.amount)) || prev?.amount,
      paidAt: updated?.paidAt ?? (canEditReceiptPaidAt ? String(formValues.paidAt || "").trim() || prev?.paidAt : prev?.paidAt),
      date: updated?.paidAt ?? updated?.date ?? (canEditReceiptPaidAt ? String(formValues.paidAt || "").trim() || prev?.date : prev?.date),
      receiptNumber: updated?.receiptNumber ?? (String(formValues.receiptNumber || "").trim() || null),
      voucherNumber: updated?.voucherNumber ?? (String(formValues.voucherNumber || "").trim() || null),
      note: updated?.notes ?? (String(formValues.notes || "").trim() || null),
    }));
    setCorrectPaymentOpen(false);
  };

  return (
    <div className="space-y-4">
      {accountQuery.isLoading ? (
        <>
          {topSummaryBlock}
          <Card className="border border-gray-200 text-sm text-gray-500">Cargando estado de cuenta...</Card>
        </>
      ) : accountQuery.isError ? (
        <>
          {topSummaryBlock}
          <Card className="border border-red-200 text-sm text-red-700">
            No se pudo cargar el estado de cuenta del alumno.
          </Card>
        </>
      ) : (
        <div
          className={
            showDrawer
              ? "grid gap-4 transition-all duration-300 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start"
              : "space-y-4 transition-all duration-300"
          }
        >
          <div className="space-y-4">
            {topSummaryBlock}

            {accountQuery.isFetching ? (
              <Card className="border border-blue-100 bg-blue-50 text-sm text-blue-700 shadow-sm">
                Actualizando estado de cuenta...
              </Card>
            ) : null}

            <Card className="flex h-[27vh] flex-col border border-gray-200 px-3 pb-3 pt-1.5 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Cargos</h2>
                </div>
                {selectedChargeRows.length ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {selectedChargeRows.length} cargo(s) seleccionado(s)
                  </span>
                ) : null}
              </div>

              <div className="h-[20vh] overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Sel.</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Concepto</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Monto</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Pendiente</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Vence</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {charges.map((charge) => (
                      <tr
                        key={charge.id}
                        className={`cursor-pointer transition hover:bg-gray-50 ${chargeRowClassName(charge.status, selectedCharges[charge.id] !== undefined)}`}
                        onClick={() => setEditingCharge(charge)}
                      >
                        <td className="px-4 py-3 text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedCharges[charge.id] !== undefined}
                            disabled={Number(charge.outstandingAmount || 0) <= 0}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => toggleCharge(charge)}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-900">{charge.concept || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{formatMoney(charge.amount)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatMoney(charge.outstandingAmount)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(charge.dueDate)}</td>
                        <td className="px-4 py-3">
                          <span className={chargeStatusClassName(charge.status)}>
                            {formatChargeStatus(charge.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!charges.length ? <p className="mt-3 text-sm text-gray-500">No hay cargos registrados.</p> : null}
            </Card>

            <Card className="flex h-[20vh] flex-col border border-gray-200 px-3 pb-3 pt-1.5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Pagos registrados</h2>
              <div className="h-[14vh] overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Codigo interno</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Recibo fisico</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Monto</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Metodo</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="cursor-pointer transition hover:bg-gray-50"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <td className="px-4 py-3 text-gray-700">{payment.internalCode || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{payment.receiptNumber || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(payment.date)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatMoney(payment.amount)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatMethod(payment.method)}</td>
                        <td className="px-4 py-3 text-gray-700">{payment.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!payments.length ? (
                <p className="mt-3 text-sm text-gray-500">No hay pagos registrados.</p>
              ) : null}
            </Card>
          </div>

          {showDrawer ? (
            <div className="space-y-4">
              <PaymentAllocationDrawer
                open={showDrawer}
                onClose={resetSelection}
                student={{
                  id: studentId,
                  names: student.names,
                  lastNames: student.lastNames,
                  dni: student.dni,
                  code: student.code,
                }}
                charges={selectedChargeRows}
                selectedAmounts={selectedCharges}
                onChangeAmount={updateChargeAmount}
                onRemoveCharge={removeCharge}
              />
            </div>
          ) : null}
        </div>
      )}

      <PaymentDetailModal
        open={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        student={{
          id: studentId,
          names: student.names,
          lastNames: student.lastNames,
          dni: student.dni,
          code: student.code,
        }}
        payment={selectedPayment}
        canCorrect={canCorrectReceipt}
        onOpenCorrect={() => setCorrectPaymentOpen(true)}
      />

      <CorrectPaymentReceiptModal
        open={Boolean(selectedPayment) && correctPaymentOpen}
        onClose={() => {
          updatePaymentReceiptMutation.reset();
          setCorrectPaymentOpen(false);
        }}
        payment={selectedPayment}
        onSave={handleCorrectPayment}
        isPending={updatePaymentReceiptMutation.isPending}
        isSuccess={updatePaymentReceiptMutation.isSuccess}
        error={updatePaymentReceiptMutation.error}
        canEditAmount={canEditReceiptAmount}
        canEditPaidAt={canEditReceiptPaidAt}
        canReassign={canReassignReceipt}
        currentStudentId={studentId}
        availableCharges={charges}
      />

      <CreateChargeModal
        open={createChargeOpen}
        onClose={() => {
          createChargeMutation.reset();
          setCreateChargeOpen(false);
          setChargeForm(initialChargeForm);
        }}
        chargeForm={chargeForm}
        setChargeForm={setChargeForm}
        billingConcepts={billingConcepts}
        onCreate={handleCreateCharge}
        isPending={createChargeMutation.isPending}
        isSuccess={createChargeMutation.isSuccess}
        errorMessage={createChargeMutation.isError ? "No se pudo crear el cargo" : ""}
      />

      <EditChargeModal
        open={Boolean(editingCharge)}
        onClose={() => {
          updateChargeMutation.reset();
          deleteChargeMutation.reset();
          setEditingCharge(null);
        }}
        charge={editingCharge}
        onSave={handleEditCharge}
        onDelete={handleDeleteCharge}
        isSaving={updateChargeMutation.isPending}
        isSaveSuccess={updateChargeMutation.isSuccess}
        saveErrorMessage={updateChargeMutation.isError ? "No se pudo actualizar el cargo" : ""}
        isDeleting={deleteChargeMutation.isPending}
        isDeleteSuccess={deleteChargeMutation.isSuccess}
        deleteErrorMessage={deleteChargeMutation.isError ? "No se pudo eliminar el cargo" : ""}
      />
    </div>
  );
}
