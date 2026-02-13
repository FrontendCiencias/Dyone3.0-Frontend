import React, { useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { useStudentSummaryQuery } from "../hooks/useStudentSummaryQuery";
import { useLinkStudentFamilyMutation } from "../../families/hooks/useLinkStudentFamilyMutation";
import { useQuickEnrollmentMutation } from "../../enrollments/hooks/useQuickEnrollmentMutation";
import { useCyclesQuery } from "../../admin/hooks/useCyclesQuery";
import { useClassroomsQuery } from "../../admin/hooks/useClassroomsQuery";

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

export default function StudentSummaryModal({ studentId, open, onClose }) {
  const summaryQuery = useStudentSummaryQuery(studentId, open);
  const cyclesQuery = useCyclesQuery();
  const classroomsQuery = useClassroomsQuery();

  const linkMutation = useLinkStudentFamilyMutation();
  const enrollmentMutation = useQuickEnrollmentMutation();

  const [familyId, setFamilyId] = useState("");
  const [guardian, setGuardian] = useState({ names: "", lastNames: "", dni: "" });
  const [enrollmentForm, setEnrollmentForm] = useState({ cycleId: "", classroomId: "" });
  const [localError, setLocalError] = useState("");

  const summary = summaryQuery.data || {};
  const student = summary.student || {};
  const familyLink = summary.familyLink || {};
  const enrollmentStatus = summary.enrollmentStatus || {};
  const debtsSummary = summary.debtsSummary || {};

  const cycles = useMemo(() => (Array.isArray(cyclesQuery.data) ? cyclesQuery.data : []), [cyclesQuery.data]);
  const classrooms = useMemo(
    () => (Array.isArray(classroomsQuery.data) ? classroomsQuery.data : []),
    [classroomsQuery.data]
  );

  const filteredClassrooms = useMemo(() => {
    if (!enrollmentForm.cycleId) return classrooms;
    return classrooms.filter((item) => String(item.cycleId) === String(enrollmentForm.cycleId));
  }, [classrooms, enrollmentForm.cycleId]);

  const handleLinkExistingFamily = async () => {
    if (!studentId || !familyId.trim()) {
      setLocalError("Debes ingresar el ID de familia.");
      return;
    }

    setLocalError("");
    await linkMutation.mutateAsync({ studentId, familyId: familyId.trim() });
    setFamilyId("");
  };

  const handleCreateAndLinkFamily = async () => {
    if (!studentId || !guardian.names.trim() || !guardian.lastNames.trim() || !guardian.dni.trim()) {
      setLocalError("Completa nombres, apellidos y DNI del tutor.");
      return;
    }

    setLocalError("");
    await linkMutation.mutateAsync({
      studentId,
      family: {
        guardians: [
          {
            names: guardian.names.trim(),
            lastNames: guardian.lastNames.trim(),
            dni: guardian.dni.trim(),
            isMainGuardian: true,
          },
        ],
      },
    });

    setGuardian({ names: "", lastNames: "", dni: "" });
  };

  const handleEnroll = async () => {
    if (!studentId || !enrollmentForm.cycleId || !enrollmentForm.classroomId) {
      setLocalError("Selecciona ciclo y aula para matricular.");
      return;
    }

    const currentCycleId = enrollmentStatus?.cycleId || enrollmentStatus?.cycle?.id;
    const currentStatus = String(enrollmentStatus?.status || "").toUpperCase();
    if (String(currentCycleId) === String(enrollmentForm.cycleId) && currentStatus === "CONFIRMED") {
      setLocalError("El alumno ya está matriculado en el ciclo seleccionado.");
      return;
    }

    setLocalError("");
    await enrollmentMutation.mutateAsync({
      studentId,
      cycleId: enrollmentForm.cycleId,
      classroomId: enrollmentForm.classroomId,
      source: "NEW",
    });

    onClose?.();
    setEnrollmentForm({ cycleId: "", classroomId: "" });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Ficha rápida del alumno</h3>
          <button type="button" onClick={onClose} className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">
            Cerrar
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
                  <p><span className="font-medium">Nombre:</span> {`${student.names || ""} ${student.lastNames || ""}`.trim() || "-"}</p>
                  <p><span className="font-medium">DNI:</span> {student.dni || "-"}</p>
                  <p><span className="font-medium">Código:</span> {student.code || "-"}</p>
                  <p><span className="font-medium">Campus:</span> {student.campusCode || "-"}</p>
                  <p><span className="font-medium">Estado:</span> {student.isActive ? "Activo" : "Inactivo"}</p>
                </div>
              </section>

              <section className="rounded-lg border bg-gray-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-900">Estado matrícula</h4>
                <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-3">
                  <p><span className="font-medium">Ciclo:</span> {enrollmentStatus?.cycle?.name || enrollmentStatus?.cycleName || "-"}</p>
                  <p><span className="font-medium">Aula:</span> {enrollmentStatus?.classroom?.displayName || enrollmentStatus?.classroomName || "-"}</p>
                  <p><span className="font-medium">Estado:</span> {enrollmentStatus?.status || "-"}</p>
                </div>
              </section>

              <section className="rounded-lg border bg-gray-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-900">Familia</h4>
                {familyLink?.mainGuardian ? (
                  <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                    <p>
                      <span className="font-medium">Tutor principal:</span>{" "}
                      {`${familyLink.mainGuardian.names || ""} ${familyLink.mainGuardian.lastNames || ""}`.trim() || "-"}
                    </p>
                    <p><span className="font-medium">DNI tutor:</span> {familyLink.mainGuardian.dni || "-"}</p>
                  </div>
                ) : (
                  <p className="rounded-md bg-white p-3 text-sm text-gray-700">Alumno sin familia vinculada</p>
                )}
              </section>

              <section className="rounded-lg border bg-gray-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-900">Deudas</h4>
                <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-3">
                  <p><span className="font-medium">Total pendiente:</span> {formatMoney(debtsSummary.pendingTotal)}</p>
                  <p><span className="font-medium">Total vencido:</span> {formatMoney(debtsSummary.overdueTotal)}</p>
                  <p><span className="font-medium">Último pago:</span> {debtsSummary.lastPaymentDate?.slice?.(0, 10) || "-"}</p>
                </div>
              </section>

              <section className="rounded-lg border bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">Acciones</h4>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md bg-white p-3">
                    <p className="mb-2 text-sm font-medium text-gray-900">Vincular familia existente</p>
                    <Input
                      label="Family ID"
                      value={familyId}
                      onChange={(e) => setFamilyId(e.target.value)}
                      placeholder="Ingresa el ID de familia"
                    />
                    <div className="mt-3 flex justify-end">
                      <Button onClick={handleLinkExistingFamily} disabled={linkMutation.isPending || enrollmentMutation.isPending}>
                        {linkMutation.isPending ? "Guardando..." : "Vincular"}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md bg-white p-3">
                    <p className="mb-2 text-sm font-medium text-gray-900">Crear familia nueva</p>
                    <div className="grid gap-2">
                      <Input
                        label="Nombres tutor"
                        value={guardian.names}
                        onChange={(e) => setGuardian((p) => ({ ...p, names: e.target.value }))}
                      />
                      <Input
                        label="Apellidos tutor"
                        value={guardian.lastNames}
                        onChange={(e) => setGuardian((p) => ({ ...p, lastNames: e.target.value }))}
                      />
                      <Input
                        label="DNI tutor"
                        value={guardian.dni}
                        onChange={(e) => setGuardian((p) => ({ ...p, dni: e.target.value }))}
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button onClick={handleCreateAndLinkFamily} disabled={linkMutation.isPending || enrollmentMutation.isPending}>
                        {linkMutation.isPending ? "Guardando..." : "Crear y vincular"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-md bg-white p-3">
                  <p className="mb-2 text-sm font-medium text-gray-900">Matricular</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Ciclo</label>
                      <select
                        className="rounded border px-3 py-2 text-sm"
                        value={enrollmentForm.cycleId}
                        onChange={(e) => setEnrollmentForm((p) => ({ ...p, cycleId: e.target.value, classroomId: "" }))}
                      >
                        <option value="">Selecciona</option>
                        {cycles.map((cycle) => (
                          <option key={cycle.id || `${cycle.name}-${cycle.year}`} value={cycle.id}>
                            {cycle.name} ({cycle.year})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Aula</label>
                      <select
                        className="rounded border px-3 py-2 text-sm"
                        value={enrollmentForm.classroomId}
                        onChange={(e) => setEnrollmentForm((p) => ({ ...p, classroomId: e.target.value }))}
                      >
                        <option value="">Selecciona</option>
                        {filteredClassrooms.map((classroom) => (
                          <option key={classroom.id || classroom.displayName} value={classroom.id}>
                            {classroom.displayName || `${classroom.level || ""} ${classroom.grade || ""} ${classroom.section || ""}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button onClick={handleEnroll} disabled={enrollmentMutation.isPending || linkMutation.isPending}>
                      {enrollmentMutation.isPending ? "Matriculando..." : "Matricular"}
                    </Button>
                  </div>
                </div>
              </section>

              {localError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{localError}</p>}
              {linkMutation.isError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{getErrorMessage(linkMutation.error)}</p>}
              {enrollmentMutation.isError && (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{getErrorMessage(enrollmentMutation.error)}</p>
              )}
              {linkMutation.isSuccess && (
                <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Familia vinculada correctamente.</p>
              )}
              {enrollmentMutation.isSuccess && (
                <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Matrícula creada correctamente.</p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end border-t px-5 py-3">
          <Button type="button" onClick={onClose} className="!bg-gray-500">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
