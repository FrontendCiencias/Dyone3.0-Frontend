import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { getEnrollmentDetail } from "../services/enrollments.service";

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
  const { enrollmentId } = useParams();

  const detailQuery = useQuery({
    queryKey: ["enrollments", "detail", enrollmentId],
    queryFn: () => getEnrollmentDetail(enrollmentId),
    enabled: Boolean(enrollmentId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const detail = detailQuery.data;

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
          <p>Confirmada: {detail.contract?.confirmedAt ? String(detail.contract.confirmedAt).slice(0, 10) : "-"}</p>
        </div>
      </Card>
    </div>
  );
}
