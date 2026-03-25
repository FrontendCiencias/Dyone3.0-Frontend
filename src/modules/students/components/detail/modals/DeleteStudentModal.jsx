import React from "react";
import Button from "../../../../../components/ui/Button";
import BaseModal from "../../../../../shared/ui/BaseModal";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";

function formatCount(value) {
  return Number(value || 0);
}

export default function DeleteStudentModal({
  open,
  onClose,
  previewQuery,
  onConfirm,
  isPending,
  isSuccess,
  errorMessage,
}) {
  const preview = previewQuery.data || {};
  const student = preview.student || {};
  const impacts = preview.impacts || {};
  const warnings = Array.isArray(preview.warnings) ? preview.warnings : [];

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Eliminar alumno"
      maxWidthClass="max-w-3xl"
      statusOverlay={isPending ? {
        state: "loading",
        title: "Eliminando alumno",
        message: "Borrando datos relacionados del sistema...",
      } : isSuccess ? {
        state: "success",
        title: "Alumno eliminado",
      } : errorMessage ? {
        state: "error",
        title: "No se pudo eliminar el alumno",
        message: errorMessage,
      } : null}
      footer={(
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{isSuccess ? "Cerrar" : "Cancelar"}</SecondaryButton>
          <Button
            onClick={onConfirm}
            disabled={isPending || isSuccess || previewQuery.isLoading || previewQuery.isError}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            Eliminar alumno
          </Button>
        </div>
      )}
    >
      <div className="space-y-4 p-5 text-sm text-gray-700">
        {previewQuery.isLoading ? (
          <p className="text-sm text-gray-500">Cargando impacto de eliminación...</p>
        ) : previewQuery.isError ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage || "No se pudo cargar el resumen de eliminación."}</p>
        ) : (
          <>
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">
                Se eliminará permanentemente al alumno {student.lastNames ? `${student.lastNames}, ${student.names || ""}`.trim() : (student.names || "Alumno")}.
              </p>
              <div className="mt-2 grid gap-2 text-xs text-red-700 sm:grid-cols-3">
                <p>Código: {student.internalCode || "-"}</p>
                <p>DNI: {student.dni || "-"}</p>
                <p>Código Caja: {student.bankCode || "-"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-sm font-semibold text-gray-900">Datos que se eliminarán</h4>
                <ul className="mt-3 space-y-1 text-sm text-gray-700">
                  <li>Alumno: {formatCount(impacts.student)}</li>
                  <li>Persona del alumno: {formatCount(impacts.studentPerson)}</li>
                  <li>Matrículas: {formatCount(impacts.enrollments)}</li>
                  <li>EnrollmentStudents: {formatCount(impacts.enrollmentStudents)}</li>
                  <li>Vacantes: {formatCount(impacts.vacancies)}</li>
                  <li>Cargos: {formatCount(impacts.charges)}</li>
                  <li>Pagos: {formatCount(impacts.payments)}</li>
                  <li>Asignaciones de pago: {formatCount(impacts.paymentAllocations)}</li>
                </ul>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-sm font-semibold text-gray-900">Relaciones y otros registros</h4>
                <ul className="mt-3 space-y-1 text-sm text-gray-700">
                  <li>Relaciones con tutores: {formatCount(impacts.tutorRelations)}</li>
                  <li>Personas de tutores preservadas: {formatCount(impacts.tutorPersonsPreserved)}</li>
                  <li>Asistencias: {formatCount(impacts.attendanceRecords)}</li>
                  <li>Resúmenes de asistencia: {formatCount(impacts.attendanceMonthlySummaries)}</li>
                  <li>Contratos: {formatCount(impacts.contractSnapshots)}</li>
                  <li>Registros de exámenes: {formatCount(impacts.examPasses)}</li>
                  <li>Notas / calificaciones: {formatCount(impacts.grades)}</li>
                  <li>Programas: {formatCount(impacts.programEnrollments)}</li>
                  <li>Usuarios ligados a su persona: {formatCount(impacts.linkedUsers)}</li>
                </ul>
              </div>
            </div>

            {warnings.length ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h4 className="text-sm font-semibold text-amber-900">Advertencias</h4>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {errorMessage ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p> : null}
          </>
        )}
      </div>
    </BaseModal>
  );
}
