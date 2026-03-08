import React, { useEffect, useMemo, useState } from "react";
import Input from "../../../components/ui/Input";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import BaseModal from "../../../shared/ui/BaseModal";

const DEFAULT_MONTHS = [
  { monthIndex: 0, label: "Marzo" },
  { monthIndex: 1, label: "Abril" },
  { monthIndex: 2, label: "Mayo" },
  { monthIndex: 3, label: "Junio" },
  { monthIndex: 4, label: "Julio" },
  { monthIndex: 5, label: "Agosto" },
  { monthIndex: 6, label: "Septiembre" },
  { monthIndex: 7, label: "Octubre" },
  { monthIndex: 8, label: "Noviembre" },
  { monthIndex: 9, label: "Diciembre" },
];

function mapInitialItems(initialItems) {
  const source = Array.isArray(initialItems) ? initialItems : [];

  return DEFAULT_MONTHS.map((month) => {
    const existing = source.find((item) => item?.monthIndex === month.monthIndex || item?.label === month.label);

    return {
      monthIndex: month.monthIndex,
      label: month.label,
      dueDate: existing?.dueDate ? String(existing.dueDate).slice(0, 10) : "",
    };
  });
}

export default function BillingScheduleModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  initialItems,
  cycleName,
  serverError,
}) {
  const [items, setItems] = useState(() => mapInitialItems(initialItems));
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (open) {
      setItems(mapInitialItems(initialItems));
      setLocalError("");
    }
  }, [open, initialItems]);

  const isValid = useMemo(() => items.every((item) => Boolean(item.dueDate)), [items]);

  const handleChangeDueDate = (monthIndex, dueDate) => {
    setItems((prev) => prev.map((item) => (item.monthIndex === monthIndex ? { ...item, dueDate } : item)));
  };

  const handleSubmit = async () => {
    if (!isValid) {
      setLocalError("Debes completar todas las fechas de vencimiento.");
      return;
    }

    setLocalError("");
    await onSubmit(items);
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Calendario de pagos${cycleName ? ` · ${cycleName}` : ""}`}
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </SecondaryButton>
          <SecondaryButton onClick={handleSubmit} disabled={isSubmitting} className="border-gray-900 bg-gray-900 text-white hover:bg-gray-800">
            {isSubmitting ? "Guardando..." : "Guardar calendario"}
          </SecondaryButton>
        </div>
      }
    >
      <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
        {items.map((item) => (
          <div key={item.monthIndex} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr_220px] md:items-end">
            <Input label="Mes" value={item.label} readOnly />
            <Input
              label="Fecha de vencimiento"
              type="date"
              value={item.dueDate}
              onChange={(event) => handleChangeDueDate(item.monthIndex, event.target.value)}
            />
          </div>
        ))}

        {localError ? <p className="text-sm text-red-600">{localError}</p> : null}
        {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
      </div>
    </BaseModal>
  );
}
