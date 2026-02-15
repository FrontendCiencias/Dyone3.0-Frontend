import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import BaseModal from "../../../shared/ui/BaseModal";
import { useAuth } from "../../../lib/auth";
import { ROUTES } from "../../../config/routes";
import { useStudentDetailQuery } from "../hooks/useStudentDetailQuery";
import IdentityEditModal from "../components/detail/IdentityEditModal";
import TutorsManageModal from "../components/detail/TutorsManageModal";
import AccountStatementModal from "../components/detail/AccountStatementModal";
import NotesEditModal from "../components/detail/NotesEditModal";

function safeUpper(value) {
  return String(value || "").toUpperCase();
}

function getErrorMessage(error) {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo cargar el expediente del alumno.";
}

function fullName(student = {}) {
  const lastNames = String(student.lastNames || "").trim();
  const names = String(student.names || "").trim();
  return [lastNames, names].filter(Boolean).join(" ") || "-";
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${amount.toFixed(2)}`;
}

function statusChipClass(status) {
  if (status === "ENROLLED") return "bg-emerald-100 text-emerald-800";
  if (status === "TRANSFERRED") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function StudentDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <div className="h-36 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-36 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const { studentId } = useParams();
  const [activeEditor, setActiveEditor] = useState(null);
  const [actionModal, setActionModal] = useState({ type: null, reason: "" });

  const detailQuery = useStudentDetailQuery(studentId);
  const detail = detailQuery.data || {};

  const student = detail.student || {};
  const familyLink = detail.familyLink || {};
  const enrollmentStatus = detail.enrollmentStatus || {};
  const debtsSummary = detail.debtsSummary || {};

  const status = safeUpper(enrollmentStatus.status || student.enrollmentStatus || "ABSENT");
  const internalNotes = detail.internalNotes || student.internalNotes || "";

  const tutors = useMemo(() => {
    const primaryTutor = familyLink?.primaryTutor_send
      ? { ...familyLink.primaryTutor_send, isPrimary: true }
      : null;
    const others = Array.isArray(familyLink?.otherTutors_send) ? familyLink.otherTutors_send : [];
    return [primaryTutor, ...others].filter(Boolean);
  }, [familyLink]);

  const isAdminOrSecretary = ["ADMIN", "SECRETARY"].some((role) => safeUpper(activeRole).startsWith(role));
  const lockEdition = activeEditor !== null;

  const headerPrimaryAction =
    status === "ABSENT" ? "Confirmar matrícula" : status === "ENROLLED" ? "Registrar pago" : null;

  const upcomingCharges = Array.isArray(debtsSummary?.upcomingCharges) ? debtsSummary.upcomingCharges.slice(0, 3) : [];

  const openEditor = (editorKey) => {
    if (lockEdition && activeEditor !== editorKey) return;
    setActiveEditor(editorKey);
  };

  if (detailQuery.isLoading) return <StudentDetailSkeleton />;

  if (detailQuery.isError) {
    return (
      <Card className="border border-red-100">
        <p className="text-sm text-red-700">{getErrorMessage(detailQuery.error)}</p>
        <div className="mt-3">
          <SecondaryButton onClick={() => navigate(ROUTES.dashboardStudents)}>Volver</SecondaryButton>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <Card className="sticky top-0 z-20 border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">{fullName(student)}</h1>
            <p className="text-sm text-gray-600">
              {student.internalCode || "COD_SIN_ASIGNAR"} · DNI: {student.dni || "-"}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">Sede: {student.campusCode || "-"}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">Nivel: {student.level || "-"}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
                Grado-Sección: {enrollmentStatus.classroomName || enrollmentStatus.classroom?.displayName || "-"}
              </span>
              <span className={`rounded-full px-2 py-1 font-semibold ${statusChipClass(status)}`}>Estado: {status}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            {headerPrimaryAction && <Button>{headerPrimaryAction}</Button>}
            <SecondaryButton onClick={() => navigate(ROUTES.dashboardStudents)}>Volver</SecondaryButton>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Card className="border border-gray-200 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Identidad</h3>
              <SecondaryButton disabled={lockEdition && activeEditor !== "identity"} onClick={() => openEditor("identity")}>
                Editar
              </SecondaryButton>
            </div>
            <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
              <p>Nombres: {student.names || "-"}</p>
              <p>Apellidos: {student.lastNames || "-"}</p>
              <p>DNI: {student.dni || "-"}</p>
              <p>Código interno: {student.internalCode || "-"}</p>
              <p>Fecha de ingreso: {student.entryDate?.slice?.(0, 10) || "-"}</p>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tutores</h3>
              <SecondaryButton disabled={lockEdition && activeEditor !== "tutors"} onClick={() => openEditor("tutors")}>
                Gestionar
              </SecondaryButton>
            </div>
            <div className="space-y-2">
              {tutors.length ? (
                tutors.map((tutor, index) => (
                  <div key={`${tutor.id || tutor._id || "tutor"}-${index}`} className="rounded-lg border border-gray-100 p-3 text-sm text-gray-700">
                    <p className="font-medium text-gray-900">{[tutor.lastNames, tutor.names].filter(Boolean).join(", ") || "-"}</p>
                    <p>Relación: {tutor.relationship || "-"}</p>
                    <p>Teléfonos: {Array.isArray(tutor.phones) ? tutor.phones.filter(Boolean).join(" - ") : tutor.phone || "-"}</p>
                    {tutor.isPrimary && (
                      <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        Principal
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Sin tutores registrados.</p>
              )}
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Matrícula / Condiciones</h3>
              {status === "ENROLLED" && (
                <SecondaryButton disabled={lockEdition && activeEditor !== "conditions"} onClick={() => openEditor("conditions")}>
                  Editar condiciones
                </SecondaryButton>
              )}
            </div>
            {!enrollmentStatus?.cycleName && !enrollmentStatus?.cycle?.name ? (
              <p className="text-sm text-gray-600">Sin matrícula confirmada.</p>
            ) : (
              <div className="space-y-2 text-sm text-gray-700">
                <p>Pensión mensual: {formatMoney(detail?.enrollment?.monthlyFee || detail?.financial?.monthlyFee)}</p>
                <p>Descuentos / exoneraciones: {detail?.enrollment?.discountsDescription || "-"}</p>
                <p>Observaciones: {detail?.enrollment?.observations || "-"}</p>
                <p>Fecha confirmación: {detail?.enrollment?.confirmedAt?.slice?.(0, 10) || "-"}</p>
                <SecondaryButton className="mt-2">Ver detalle</SecondaryButton>
              </div>
            )}
            {activeEditor === "conditions" && (
              <p className="mt-2 text-xs text-gray-500">TODO: conectar edición de condiciones con endpoint oficial de matrícula.</p>
            )}
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notas internas</h3>
              <SecondaryButton disabled={lockEdition && activeEditor !== "notes"} onClick={() => openEditor("notes")}>
                Editar
              </SecondaryButton>
            </div>
            <textarea
              readOnly
              value={internalNotes || "Sin notas internas"}
              className="min-h-[120px] w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card className="border border-gray-200 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Estado académico</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>Ciclo actual: {enrollmentStatus.cycleName || enrollmentStatus.cycle?.name || "-"}</p>
              <p>Aula actual: {enrollmentStatus.classroomName || enrollmentStatus.classroom?.displayName || "-"}</p>
              <p>Estado: {status}</p>
            </div>
            <div className="mt-3">
              <SecondaryButton disabled={!isAdminOrSecretary} onClick={() => setActionModal({ type: "changeClassroom", reason: "" })}>
                Cambiar aula
              </SecondaryButton>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Finanzas</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>Deuda total: {formatMoney(debtsSummary.pendingTotal)}</p>
              <div>
                <p className="font-medium text-gray-900">Próximos cargos:</p>
                <ul className="list-inside list-disc text-sm text-gray-600">
                  {upcomingCharges.length ? (
                    upcomingCharges.map((charge, index) => (
                      <li key={`${charge.id || charge.concept || "charge"}-${index}`}>
                        {charge.concept || charge.name || "Cargo"} - {formatMoney(charge.amount)}
                      </li>
                    ))
                  ) : (
                    <li>Sin cargos próximos.</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <SecondaryButton disabled={lockEdition && activeEditor !== "accountStatement"} onClick={() => openEditor("accountStatement")}>
                Ver estado de cuenta
              </SecondaryButton>
              <SecondaryButton disabled={!isAdminOrSecretary}>Agregar cargo</SecondaryButton>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Acciones</h3>
            <div className="space-y-2">
              <SecondaryButton
                className="w-full border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => setActionModal({ type: "transfer", reason: "" })}
              >
                Marcar trasladado
              </SecondaryButton>
              {status !== "ABSENT" && (
                <SecondaryButton
                  className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => setActionModal({ type: "revertAbsent", reason: "" })}
                >
                  Revertir a ausente
                </SecondaryButton>
              )}
            </div>
          </Card>
        </div>
      </div>

      <IdentityEditModal
        open={activeEditor === "identity"}
        onClose={() => setActiveEditor(null)}
        student={student}
        onSave={() => setActiveEditor(null)}
      />
      <TutorsManageModal open={activeEditor === "tutors"} onClose={() => setActiveEditor(null)} tutors={tutors} />
      <AccountStatementModal
        open={activeEditor === "accountStatement"}
        onClose={() => setActiveEditor(null)}
        debtsSummary={debtsSummary}
      />
      <NotesEditModal
        open={activeEditor === "notes"}
        onClose={() => setActiveEditor(null)}
        value={internalNotes}
        onSave={() => setActiveEditor(null)}
      />

      <BaseModal
        open={Boolean(actionModal.type)}
        onClose={() => setActionModal({ type: null, reason: "" })}
        title="Confirmar acción"
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setActionModal({ type: null, reason: "" })}>Cancelar</SecondaryButton>
            <Button onClick={() => setActionModal({ type: null, reason: "" })}>Confirmar</Button>
          </div>
        }
      >
        <div className="space-y-3 p-5 text-sm text-gray-700">
          <p>
            {actionModal.type === "transfer" && "Confirma marcar al alumno como trasladado."}
            {actionModal.type === "revertAbsent" && "Confirma revertir el estado del alumno a ausente."}
            {actionModal.type === "changeClassroom" && "Confirma el cambio de aula para el alumno."}
          </p>
          <label className="block text-sm font-medium text-gray-700" htmlFor="action-reason">
            Motivo
          </label>
          <textarea
            id="action-reason"
            value={actionModal.reason}
            onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))}
            className="min-h-[110px] w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <p className="text-xs text-gray-500">TODO: conectar acción al endpoint correspondiente cuando esté disponible.</p>
        </div>
      </BaseModal>
    </div>
  );
}
