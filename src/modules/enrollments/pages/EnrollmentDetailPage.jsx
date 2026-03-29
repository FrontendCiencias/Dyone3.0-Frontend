import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import BaseModal from "../../../shared/ui/BaseModal";
import { ROUTES } from "../../../config/routes";
import { getEnrollmentDetail, updateEnrollmentContract } from "../services/enrollments.service";

function statusLabel(status) {
  const value = String(status || "").toUpperCase();
  if (value === "TRANSFERRED") return "Trasladada";
  if (value === "ABSENT") return "Ausente";
  return "Matriculada";
}

function statusClasses(status) {
  const value = String(status || "").toUpperCase();
  if (value === "TRANSFERRED") return "bg-amber-100 text-amber-700";
  if (value === "ABSENT") return "bg-slate-200 text-slate-700";
  return "bg-emerald-100 text-emerald-700";
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function getErrorMessage(error, fallback = "No se pudo cargar la matrícula") {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return fallback;
}

export default function EnrollmentDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enrollmentId } = useParams();
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractForm, setContractForm] = useState({ address: "", notes: "", contractDate: "" });
  const [contractError, setContractError] = useState("");

  const detailQuery = useQuery({
    queryKey: ["enrollments", "detail", enrollmentId],
    queryFn: () => getEnrollmentDetail(enrollmentId),
    enabled: Boolean(enrollmentId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const detail = detailQuery.data;

  const currentContractDate = useMemo(() => {
    if (!detail?.contract?.confirmedAt) return "";
    return String(detail.contract.confirmedAt).slice(0, 10);
  }, [detail?.contract?.confirmedAt]);

  const updateContractMutation = useMutation({
    mutationFn: (payload) => updateEnrollmentContract(enrollmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["enrollments", "detail", enrollmentId] });
      await queryClient.invalidateQueries({ queryKey: ["enrollments", "list"] });
      setIsContractModalOpen(false);
      setContractError("");
    },
    onError: (error) => {
      setContractError(getErrorMessage(error, "No se pudo guardar los datos del contrato"));
    },
  });

  function openContractEditModal() {
    setContractForm({
      address: detail?.contract?.address || "",
      notes: detail?.contract?.notes || "",
      contractDate: currentContractDate || "",
    });
    setContractError("");
    setIsContractModalOpen(true);
  }

  function handleSaveContract() {
    if (!String(contractForm.address || "").trim()) {
      setContractError("La dirección de contacto es obligatoria.");
      return;
    }

    if (!String(contractForm.contractDate || "").trim()) {
      setContractError("La fecha de celebración del contrato es obligatoria.");
      return;
    }

    updateContractMutation.mutate({
      address: String(contractForm.address || "").trim(),
      notes: String(contractForm.notes || "").trim(),
      contractDate: contractForm.contractDate,
    });
  }

  if (detailQuery.isLoading) {
    return <Card className="border border-gray-200 text-sm text-gray-500">Cargando detalle de matrícula...</Card>;
  }

  if (detailQuery.isError || !detail) {
    return (
      <Card className="border border-red-100 text-sm text-red-700">
        {getErrorMessage(detailQuery.error)}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">Detalle de matrícula</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(detail.status)}`}>
                {statusLabel(detail.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Ciclo: {detail.cycle?.name || "-"} · Campus principal: {detail.campus?.name || detail.campus?.code || "-"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton onClick={() => navigate(ROUTES.dashboardEnrollments)}>Volver</SecondaryButton>
            <SecondaryButton onClick={openContractEditModal}>Completar contrato</SecondaryButton>
            <Button
              onClick={() =>
                window.open(
                  `${ROUTES.dashboardEnrollmentContractPreview}?enrollmentId=${encodeURIComponent(detail.id)}`,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              Ver contrato
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Alumnos de la matrícula</h2>
        <div className="mt-3 space-y-3">
          {detail.students.map((student) => (
            <div key={student.enrollmentStudentId || student.studentId} className="rounded-xl border border-gray-200 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-medium text-gray-900">{student.fullName || "Alumno"}</p>
                  <p className="text-sm text-gray-600">
                    DNI: {student.dni || "-"} · Código: {student.internalCode || "-"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Aula: {student.classroom?.displayName || "-"}
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Derecho de ingreso: {formatMoney(student.admissionFee?.amount)}</p>
                  <p>Matrícula: {formatMoney(student.enrollmentFee?.amount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Tutores firmantes</h2>
        <div className="mt-3 space-y-3">
          {detail.tutors.length ? detail.tutors.map((tutor) => (
            <div key={tutor.personId} className="rounded-xl border border-gray-200 p-3">
              <p className="font-medium text-gray-900">{tutor.fullName || "Tutor"}</p>
              <p className="text-sm text-gray-600">
                DNI: {tutor.dni || "-"} · Teléfono: {tutor.phone || "-"} · Parentesco: {tutor.relationship || "-"}
              </p>
            </div>
          )) : (
            <p className="text-sm text-gray-500">No hay tutores relacionados para esta matrícula.</p>
          )}
        </div>
      </Card>

      <Card className="border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Contrato</h2>
        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <p>Dirección de contacto: {detail.contract?.address || "-"}</p>
          <p>Observaciones: {detail.contract?.notes || "-"}</p>
          <p>Fecha de contrato: {detail.contract?.confirmedAt ? String(detail.contract.confirmedAt).slice(0, 10) : "-"}</p>
        </div>
      </Card>

      <BaseModal
        open={isContractModalOpen}
        onClose={() => !updateContractMutation.isPending && setIsContractModalOpen(false)}
        title="Completar datos de contrato"
        maxWidthClass="max-w-2xl"
        footer={(
          <div className="flex flex-wrap justify-end gap-2">
            <SecondaryButton onClick={() => setIsContractModalOpen(false)} disabled={updateContractMutation.isPending}>
              Cancelar
            </SecondaryButton>
            <Button onClick={handleSaveContract} disabled={updateContractMutation.isPending}>
              Guardar
            </Button>
          </div>
        )}
      >
        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-gray-600">
            Este ajuste es solo para completar datos históricos del contrato. No modifica alumnos ni tutores.
          </p>

          <Input
            label="Fecha de celebración del contrato"
            type="date"
            value={contractForm.contractDate}
            onChange={(e) => {
              setContractForm((prev) => ({ ...prev, contractDate: e.target.value }));
              setContractError("");
            }}
          />

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Dirección de contacto</label>
            <textarea
              value={contractForm.address}
              onChange={(e) => {
                setContractForm((prev) => ({ ...prev, address: e.target.value }));
                setContractError("");
              }}
              rows={3}
              className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
              placeholder="Dirección usada en el contrato"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              value={contractForm.notes}
              onChange={(e) => {
                setContractForm((prev) => ({ ...prev, notes: e.target.value }));
                setContractError("");
              }}
              rows={4}
              className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
              placeholder="Observaciones del contrato"
            />
          </div>

          {contractError ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {contractError}
            </div>
          ) : null}
        </div>
      </BaseModal>
    </div>
  );
}
