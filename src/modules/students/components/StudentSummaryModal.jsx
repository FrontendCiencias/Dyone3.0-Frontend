import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import { ROUTES } from "../../../config/routes";
import { useStudentSummaryQuery } from "../hooks/useStudentSummaryQuery";

function getErrorMessage(error) {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "Ocurrió un error inesperado.";
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${amount.toFixed(2)}`;
}

function fullName(student) {
  const lastNames = String(student?.lastNames || "").trim();
  const names = String(student?.names || "").trim();
  if (lastNames && names) return `${lastNames}, ${names}`;
  return lastNames || names || "-";
}

function resolveMainGuardian(familyLink) {
  const guardians = Array.isArray(familyLink?.guardians) ? familyLink.guardians : [];
  if (!guardians.length) return null;
  return guardians.find((item) => item?.isMainGuardian) || guardians[0];
}

export default function StudentSummaryModal({ studentId, open, onClose }) {
  const navigate = useNavigate();
  const summaryQuery = useStudentSummaryQuery(studentId, open);

  const summary = summaryQuery.data || {};
  const student = summary.student || {};
  const familyLink = summary.familyLink || {};
  const enrollmentStatus = summary.enrollmentStatus || {};
  const debtsSummary = summary.debtsSummary || {};

  const mainGuardian = resolveMainGuardian(familyLink);

  if (!open) return null;

  const handleGoToEdit = () => {
    onClose?.();
    navigate(ROUTES.dashboardStudentDetail(String(studentId)));
  };

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />

      <div className="absolute inset-0 z-[121] flex items-center justify-center p-4">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Ficha rápida del alumno</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="rounded px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="max-h-[calc(90vh-140px)] space-y-4 overflow-auto p-5">
            {summaryQuery.isLoading && <p className="text-sm text-gray-600">Cargando ficha...</p>}
            {summaryQuery.isError && (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{getErrorMessage(summaryQuery.error)}</p>
            )}

            {!summaryQuery.isLoading && !summaryQuery.isError && (
              <>
                <section className="rounded-lg border bg-gray-50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">Datos del alumno</h4>
                  <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                    <p>
                      <span className="font-medium">Nombre:</span> {fullName(student)}
                    </p>
                    <p>
                      <span className="font-medium">DNI:</span> {student.dni || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Código:</span> {student.code || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Campus:</span> {student.campusCode || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Estado:</span> {student.isActive ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </section>

                <section className="rounded-lg border bg-gray-50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">Estado matrícula</h4>
                  <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-3">
                    <p>
                      <span className="font-medium">Ciclo:</span> {enrollmentStatus.cycleName || enrollmentStatus.cycle?.name || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Aula:</span> {enrollmentStatus.classroomName || enrollmentStatus.classroom?.displayName || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Estado:</span> {enrollmentStatus.status || "-"}
                    </p>
                  </div>
                </section>

                <section className="rounded-lg border bg-gray-50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">Familia</h4>
                  <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                    <p>
                      <span className="font-medium">Tutor principal:</span>{" "}
                      {mainGuardian
                        ? `${mainGuardian.lastNames || ""}, ${mainGuardian.names || ""}`.replace(/^,\s*/, "").trim() || "-"
                        : familyLink.mainGuardianName || "-"}
                    </p>
                    <p>
                      <span className="font-medium">DNI tutor:</span>{" "}
                      {mainGuardian?.dni || familyLink.mainGuardianDni || "-"}
                    </p>
                  </div>
                </section>

                <section className="rounded-lg border bg-gray-50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">Deudas</h4>
                  <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-3">
                    <p>
                      <span className="font-medium">Total pendiente:</span> {formatMoney(debtsSummary.pendingTotal)}
                    </p>
                    <p>
                      <span className="font-medium">Total vencido:</span> {formatMoney(debtsSummary.overdueTotal)}
                    </p>
                    <p>
                      <span className="font-medium">Último pago:</span> {debtsSummary.lastPaymentDate?.slice?.(0, 10) || "-"}
                    </p>
                  </div>
                </section>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t px-5 py-3">
            <Button type="button" onClick={onClose} className="!bg-gray-500">
              Cerrar
            </Button>
            <Button type="button" onClick={handleGoToEdit} disabled={!studentId}>
              Editar alumno
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
