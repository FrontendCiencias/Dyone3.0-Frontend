import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import SearchSelect from "../../../shared/ui/SearchSelect";
import { useActivityStudentSearchQuery } from "../hooks/useActivityStudentSearchQuery";
import { useActivityCollectorSearchQuery } from "../hooks/useActivityCollectorSearchQuery";

function getStudentLabel(student) {
  return [student?.lastNames, student?.names].filter(Boolean).join(", ") || "Alumno";
}

function getCollectorLabel(collector) {
  return collector?.name || collector?.email || "Usuario";
}

export default function ActivityCollectionEditModal({
  open,
  onClose,
  activity,
  item,
  onSubmit,
  submitting = false,
}) {
  const [amount, setAmount] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [collectorSearch, setCollectorSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCollector, setSelectedCollector] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !item) return;
    setAmount(item?.latestCollection?.amount ? String(item.latestCollection.amount) : "");
    setSelectedStudent(item?.student || null);
    setStudentSearch(getStudentLabel(item?.student));
    setSelectedCollector(
      item?.latestCollection?.collectorUserId
        ? {
            id: item.latestCollection.collectorUserId,
            name: item.latestCollection.collectorName,
            collectorRole: item.latestCollection.collectorRole,
          }
        : null,
    );
    setCollectorSearch(
      item?.latestCollection?.collectorName
        ? `${item.latestCollection.collectorName}${item.latestCollection.collectorRole ? ` · ${item.latestCollection.collectorRole}` : ""}`
        : "",
    );
    setError("");
  }, [open, item]);

  const studentQuery = useActivityStudentSearchQuery(
    { q: studentSearch.trim(), campus: activity?.campus?.code, limit: 10 },
    open && studentSearch.trim().length >= 2,
  );

  const collectorQuery = useActivityCollectorSearchQuery(
    { q: collectorSearch.trim(), campus: activity?.campus?.code, limit: 10 },
    open && collectorSearch.trim().length >= 2,
  );

  const statusOverlay = useMemo(() => (submitting ? { state: "loading", title: "Guardando cambios..." } : null), [submitting]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!item?.latestCollection?.id) {
      setError("No se pudo resolver el cobro.");
      return;
    }
    if (!selectedStudent?.id) {
      setError("Selecciona un alumno válido.");
      return;
    }
    if (!selectedCollector?.id) {
      setError("Selecciona un cobrador válido.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }

    try {
      await onSubmit?.({
        collectionId: item.latestCollection.id,
        payload: {
          studentId: selectedStudent.id,
          collectorUserId: selectedCollector.id,
          amount: Number(amount),
        },
      });
    } catch (submitError) {
      const message = submitError?.response?.data?.message || submitError?.message || "No se pudo actualizar el cobro.";
      setError(Array.isArray(message) ? message.join(". ") : message);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={submitting ? undefined : onClose}
      title="Editar pago de actividad"
      maxWidthClass="max-w-2xl"
      statusOverlay={statusOverlay}
      footer={(
        <div className="flex items-center justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={submitting}>Cancelar</SecondaryButton>
          <Button type="submit" form="activity-collection-edit-form" disabled={submitting}>Guardar cambios</Button>
        </div>
      )}
    >
      <form id="activity-collection-edit-form" onSubmit={handleSubmit} className="grid gap-4 px-5 py-4">
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Recibo</p>
          <p className="mt-1 font-semibold text-gray-900">{item?.latestCollection?.receiptInternalCode || "-"}</p>
          <p className="mt-1 text-xs text-gray-500">{activity?.name || "Actividad"}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Monto"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Método</p>
            <p className="mt-1 font-semibold text-gray-900">{item?.latestCollection?.methodLabel || "-"}</p>
          </div>
        </div>

        <SearchSelect
          label="Alumno"
          value={studentSearch}
          onChange={(event) => {
            setStudentSearch(event.target.value);
            setSelectedStudent(null);
          }}
          placeholder="Busca por nombre, DNI o código"
          options={studentQuery.data?.items || []}
          isLoading={studentQuery.isLoading || studentQuery.isFetching}
          onSelect={(option) => {
            setSelectedStudent(option);
            setStudentSearch(getStudentLabel(option));
          }}
          emptyText="Sin alumnos para esa búsqueda."
          renderOption={(option) => (
            <div>
              <div className="font-medium text-gray-900">{getStudentLabel(option)}</div>
              <div className="text-xs text-gray-500">
                {[option?.internalCode, option?.dni, option?.classroomDisplayName].filter(Boolean).join(" · ") || "Sin datos"}
              </div>
            </div>
          )}
        />

        <SearchSelect
          label="Quién cobró"
          value={collectorSearch}
          onChange={(event) => {
            setCollectorSearch(event.target.value);
            setSelectedCollector(null);
          }}
          placeholder="Busca por nombre o correo"
          options={collectorQuery.data?.items || []}
          isLoading={collectorQuery.isLoading || collectorQuery.isFetching}
          onSelect={(option) => {
            setSelectedCollector(option);
            setCollectorSearch(`${getCollectorLabel(option)}${option?.collectorRole ? ` · ${option.collectorRole}` : ""}`);
          }}
          emptyText="Sin cobradores para esa búsqueda."
          renderOption={(option) => (
            <div>
              <div className="font-medium text-gray-900">{getCollectorLabel(option)}</div>
              <div className="text-xs text-gray-500">
                {[option?.collectorRole, option?.email].filter(Boolean).join(" · ") || "Sin datos"}
              </div>
            </div>
          )}
        />
      </form>
    </BaseModal>
  );
}
