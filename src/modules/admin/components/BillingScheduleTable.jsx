import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useCyclesQuery } from "../hooks/useCyclesQuery";
import { useBillingScheduleQuery } from "../hooks/useBillingScheduleQuery";
import BillingScheduleModal from "./BillingScheduleModal";
import { createBillingSchedule } from "../services/adminBillingSchedule.service";

function getErrorMessage(error, fallback) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return fallback;
}

function formatDueDate(dateValue) {
  if (!dateValue) return "-";
  const normalized = String(dateValue).slice(0, 10);
  const [year, month, day] = normalized.split("-");
  if (!year || !month || !day) return "-";
  return `${day}/${month}/${year}`;
}

function getRowsFromSchedule(scheduleData) {
  if (!scheduleData) return [];

  const topConceptCode = scheduleData?.conceptCode || "TUITION";
  const items = Array.isArray(scheduleData)
    ? scheduleData
    : Array.isArray(scheduleData?.items)
      ? scheduleData.items
      : Array.isArray(scheduleData?.data?.items)
        ? scheduleData.data.items
        : [];

  return items
    .map((item, index) => ({
      monthIndex: Number.isInteger(item?.monthIndex) ? item.monthIndex : index,
      label: item?.label || "-",
      conceptCode: item?.conceptCode || topConceptCode,
      dueDate: item?.dueDate || "",
    }))
    .sort((a, b) => a.monthIndex - b.monthIndex);
}

export default function BillingScheduleTable({ canAccess }) {
  const queryClient = useQueryClient();
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cyclesQuery = useCyclesQuery();
  const cycles = Array.isArray(cyclesQuery.data) ? cyclesQuery.data : [];

  useEffect(() => {
    if (!cycles.length || selectedCycleId) return;
    const activeCycle = cycles.find((cycle) => cycle?.isActive);
    setSelectedCycleId(activeCycle?.id || cycles[0]?.id || "");
  }, [cycles, selectedCycleId]);

  const selectedCycle = useMemo(() => cycles.find((cycle) => cycle?.id === selectedCycleId), [cycles, selectedCycleId]);
  const billingScheduleQuery = useBillingScheduleQuery(selectedCycleId);
  const rows = useMemo(() => getRowsFromSchedule(billingScheduleQuery.data), [billingScheduleQuery.data]);

  const createMutation = useMutation({
    mutationFn: createBillingSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "billingSchedule", selectedCycleId] });
      setIsModalOpen(false);
    },
  });

  const handleSaveSchedule = async (items) => {
    if (!selectedCycleId) return;

    await createMutation.mutateAsync({
      cycleId: selectedCycleId,
      conceptCode: "TUITION",
      items,
    });
  };

  return (
    <Card className="rounded-xl border border-gray-200 p-4 shadow-none">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Calendario de Pagos</h3>
          <p className="text-sm text-gray-600">Configura vencimientos de pensiones por ciclo.</p>
        </div>

        {canAccess ? (
          <div className="flex min-w-[220px] flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Ciclo activo</label>
            <select
              value={selectedCycleId}
              onChange={(event) => setSelectedCycleId(event.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
            >
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {!canAccess ? <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">No tienes permisos para esta sección.</p> : null}

      {canAccess && cyclesQuery.isLoading ? <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">Cargando ciclos...</p> : null}

      {canAccess && cyclesQuery.isError ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{getErrorMessage(cyclesQuery.error, "No se pudo cargar ciclos.")}</p>
      ) : null}

      {canAccess && !cyclesQuery.isLoading && !cycles.length ? (
        <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">No hay ciclos registrados.</p>
      ) : null}

      {canAccess && Boolean(selectedCycleId) ? (
        <>
          {billingScheduleQuery.isLoading ? <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">Cargando calendario...</p> : null}

          {billingScheduleQuery.isError ? (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {getErrorMessage(billingScheduleQuery.error, "No se pudo cargar el calendario de pagos.")}
            </p>
          ) : null}

          {!billingScheduleQuery.isLoading && !billingScheduleQuery.isError && rows.length ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-700">
                    <th className="px-3 py-2">Mes</th>
                    <th className="px-3 py-2">Concepto</th>
                    <th className="px-3 py-2">Fecha de vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.monthIndex}-${row.label}`} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{row.label}</td>
                      <td className="px-3 py-2">{row.conceptCode}</td>
                      <td className="px-3 py-2">{formatDueDate(row.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!billingScheduleQuery.isLoading && !billingScheduleQuery.isError && !rows.length ? (
            <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">No hay calendario de pagos configurado para este ciclo.</p>
          ) : null}

          <div className="mt-4 flex justify-end">
            <SecondaryButton onClick={() => setIsModalOpen(true)}>
              {rows.length ? "Crear / Editar calendario" : "Crear calendario"}
            </SecondaryButton>
          </div>
        </>
      ) : null}

      <BillingScheduleModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveSchedule}
        isSubmitting={createMutation.isPending}
        initialItems={rows}
        cycleName={selectedCycle?.name}
        serverError={createMutation.isError ? getErrorMessage(createMutation.error, "No se pudo guardar el calendario.") : ""}
      />
    </Card>
  );
}
