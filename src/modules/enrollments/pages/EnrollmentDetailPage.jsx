import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import BaseModal from "../../../shared/ui/BaseModal";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { getEnrollmentDetail, listEnrollments, mergeEnrollment, updateEnrollmentContract, updateEnrollmentStudentCosts } from "../services/enrollments.service";
import IdentityEditModal from "../../students/components/detail/modals/IdentityEditModal";
import TutorsManageModal from "../../students/components/detail/modals/TutorsManageModal";
import { useStudentDetailQuery } from "../../students/hooks/useStudentDetailQuery";
import { useUpdateStudentIdentityMutation } from "../../students/hooks/useUpdateStudentIdentityMutation";
import { useUpdateTutorMutation } from "../../students/hooks/useUpdateTutorMutation";
import { useDeleteTutorMutation } from "../../students/hooks/useDeleteTutorMutation";
import { useCreateTutorMutation } from "../../students/hooks/useCreateTutorMutation";

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

function getMonthlyPensionAmount(student) {
  const amounts = Array.isArray(student?.pensionMonthlyAmounts) ? student.pensionMonthlyAmounts : [];
  const firstApplicable = amounts.find((amount) => Number(amount) >= 0);
  return Number(firstApplicable || 0);
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
  const { activeRole } = useAuth();
  const { enrollmentId } = useParams();
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractForm, setContractForm] = useState({ address: "", notes: "", contractDate: "" });
  const [contractError, setContractError] = useState("");
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeSearch, setMergeSearch] = useState("");
  const [selectedSourceEnrollmentId, setSelectedSourceEnrollmentId] = useState("");
  const [mergeNotes, setMergeNotes] = useState("");
  const [mergeError, setMergeError] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentCostsForm, setStudentCostsForm] = useState({
    enrollmentStudentId: "",
    admissionFeeAmount: "0",
    enrollmentFeeAmount: "0",
    pensionAmount: "0",
  });
  const [studentCostsError, setStudentCostsError] = useState("");
  const [editingIdentityStudentId, setEditingIdentityStudentId] = useState("");
  const [managingTutorsStudentId, setManagingTutorsStudentId] = useState("");
  const [identityFormError, setIdentityFormError] = useState("");
  const [tutorManageError, setTutorManageError] = useState("");

  const detailQuery = useQuery({
    queryKey: ["enrollments", "detail", enrollmentId],
    queryFn: () => getEnrollmentDetail(enrollmentId),
    enabled: Boolean(enrollmentId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const detail = detailQuery.data;
  const isAbsentEnrollment = String(detail?.status || "").toUpperCase() === "ABSENT";
  const isAdmin = String(activeRole || "").toUpperCase() === "ADMIN";
  const activeStudentDetailId = editingIdentityStudentId || managingTutorsStudentId;
  const activeStudentDetailQuery = useStudentDetailQuery(activeStudentDetailId, Boolean(activeStudentDetailId));
  const activeStudentDetail = activeStudentDetailQuery.data || {};
  const activeStudent = activeStudentDetail.student || {};
  const activeTutorLink = activeStudentDetail.tutorLink || activeStudentDetail.familyLink || {};

  const activeTutors = useMemo(() => {
    const primaryTutorBase = activeTutorLink?.primaryTutor || activeTutorLink?.primaryTutor_send;
    const primaryTutor = primaryTutorBase
      ? { ...primaryTutorBase, isPrimary: true }
      : null;
    const others = Array.isArray(activeTutorLink?.otherTutors)
      ? activeTutorLink.otherTutors
      : Array.isArray(activeTutorLink?.otherTutors_send)
        ? activeTutorLink.otherTutors_send
        : [];

    return [primaryTutor, ...others].filter(Boolean);
  }, [activeTutorLink]);

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

  const updateStudentCostsMutation = useMutation({
    mutationFn: (payload) => updateEnrollmentStudentCosts(enrollmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["enrollments", "detail", enrollmentId] });
      await queryClient.invalidateQueries({ queryKey: ["enrollments", "list"] });
      setEditingStudent(null);
      setStudentCostsError("");
    },
    onError: (error) => {
      setStudentCostsError(getErrorMessage(error, "No se pudo actualizar los montos del alumno"));
    },
  });

  const updateIdentityMutation = useUpdateStudentIdentityMutation(activeStudentDetailId);
  const updateTutorMutation = useUpdateTutorMutation(activeStudentDetailId);
  const deleteTutorMutation = useDeleteTutorMutation(activeStudentDetailId);
  const createTutorMutation = useCreateTutorMutation(activeStudentDetailId);

  const mergeCandidatesQuery = useQuery({
    queryKey: ["enrollments", "merge-candidates", enrollmentId, mergeSearch],
    queryFn: async () => {
      const response = await listEnrollments({ q: mergeSearch.trim(), limit: 20 });
      const items = Array.isArray(response?.items) ? response.items : [];
      return items.filter((item) => String(item?.enrollmentId || "") !== String(enrollmentId || ""));
    },
    enabled: isMergeModalOpen && mergeSearch.trim().length >= 2,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const mergeMutation = useMutation({
    mutationFn: ({ sourceEnrollmentId, notes }) => mergeEnrollment(enrollmentId, { sourceEnrollmentId, notes }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["enrollments", "detail", enrollmentId] });
      await queryClient.invalidateQueries({ queryKey: ["enrollments", "list"] });
      setIsMergeModalOpen(false);
      setMergeSearch("");
      setSelectedSourceEnrollmentId("");
      setMergeNotes("");
      setMergeError("");
    },
    onError: (error) => {
      setMergeError(getErrorMessage(error, "No se pudo fusionar las matrículas"));
    },
  });

  const mergeCandidates = useMemo(() => {
    if (mergeSearch.trim().length < 2) return [];
    if (!Array.isArray(mergeCandidatesQuery.data)) return [];

    const unique = new Map();
    for (const item of mergeCandidatesQuery.data) {
      const candidateId = item?.enrollmentId;
      if (!candidateId || unique.has(candidateId)) continue;
      unique.set(candidateId, item);
    }

    return [...unique.values()];
  }, [mergeCandidatesQuery.data, mergeSearch]);

  const selectedMergeCandidate = useMemo(
    () => mergeCandidates.find((row) => String(row.enrollmentId) === String(selectedSourceEnrollmentId)) || null,
    [mergeCandidates, selectedSourceEnrollmentId]
  );

  useEffect(() => {
    if (!isMergeModalOpen) return;
    setSelectedSourceEnrollmentId("");
    setMergeError("");
  }, [mergeSearch, isMergeModalOpen]);

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

  function openMergeModal() {
    setMergeSearch("");
    setSelectedSourceEnrollmentId("");
    setMergeNotes("");
    setMergeError("");
    setIsMergeModalOpen(true);
  }

  function handleMergeEnrollments() {
    if (!selectedSourceEnrollmentId) {
      setMergeError("Selecciona una matrícula origen para fusionar.");
      return;
    }

    mergeMutation.mutate({
      sourceEnrollmentId: selectedSourceEnrollmentId,
      notes: String(mergeNotes || "").trim(),
    });
  }

  function openStudentCostsModal(student) {
    setEditingStudent(student);
    setStudentCostsError("");
    setStudentCostsForm({
      enrollmentStudentId: student?.enrollmentStudentId || "",
      admissionFeeAmount: String(Number(student?.admissionFee?.amount || 0)),
      enrollmentFeeAmount: String(Number(student?.enrollmentFee?.amount || 0)),
      pensionAmount: String(getMonthlyPensionAmount(student)),
    });
  }

  function handleSaveStudentCosts() {
    const admissionFeeAmount = Number(studentCostsForm.admissionFeeAmount || 0);
    const enrollmentFeeAmount = Number(studentCostsForm.enrollmentFeeAmount || 0);
    const pensionAmount = Number(studentCostsForm.pensionAmount || 0);

    if ([admissionFeeAmount, enrollmentFeeAmount, pensionAmount].some((amount) => Number.isNaN(amount) || amount < 0)) {
      setStudentCostsError("Todos los montos deben ser números mayores o iguales a cero.");
      return;
    }

    updateStudentCostsMutation.mutate({
      students: [{
        enrollmentStudentId: studentCostsForm.enrollmentStudentId,
        admissionFeeAmount,
        enrollmentFeeAmount,
        pensionAmount,
      }],
    });
  }

  function buildIdentityPayload(formValues = {}) {
    const trimOrEmpty = (value) => String(value || "").trim();
    const original = {
      names: trimOrEmpty(activeStudent?.names),
      lastNames: trimOrEmpty(activeStudent?.lastNames),
      dni: trimOrEmpty(activeStudent?.dni),
      bankCode: trimOrEmpty(activeStudent?.bankCode),
      gender: trimOrEmpty(activeStudent?.gender),
      phone: trimOrEmpty(activeStudent?.phone),
      address: trimOrEmpty(activeStudent?.address),
    };

    const next = {
      names: trimOrEmpty(formValues?.names),
      lastNames: trimOrEmpty(formValues?.lastNames),
      dni: trimOrEmpty(formValues?.dni),
      bankCode: trimOrEmpty(formValues?.bankCode),
      gender: trimOrEmpty(formValues?.gender),
      phone: trimOrEmpty(formValues?.phone),
      address: trimOrEmpty(formValues?.address),
    };

    if (!next.names && !next.lastNames) return { error: "Debe completar nombres o apellidos." };
    if (next.bankCode && !/^\d{10}$/.test(next.bankCode)) {
      return { error: "Cod. Caja Arequipa debe tener 10 dígitos." };
    }

    const payload = {};
    ["names", "lastNames", "dni", "bankCode", "gender", "phone", "address"].forEach((key) => {
      if (next[key] !== original[key] && next[key] !== "") payload[key] = next[key];
    });

    if (payload.bankCode && Object.keys(payload).length === 1) {
      payload.names = next.names || original.names;
    }

    if (!Object.keys(payload).length) {
      return { error: "No hay cambios para guardar." };
    }

    return { payload };
  }

  async function handleSaveIdentity(formValues) {
    const { payload, error } = buildIdentityPayload(formValues);
    if (error) {
      setIdentityFormError(error);
      return;
    }

    setIdentityFormError("");
    await updateIdentityMutation.mutateAsync(payload);
    await queryClient.invalidateQueries({ queryKey: ["enrollments", "detail", enrollmentId] });
  }

  async function handleSaveTutor(selectedTutor, formValues) {
    const tutorId = String(selectedTutor?.id || selectedTutor?._id || "").trim();
    if (!tutorId) {
      setTutorManageError("No se pudo identificar el tutor seleccionado.");
      return;
    }

    const payload = {
      names: String(formValues?.names || "").trim(),
      lastNames: String(formValues?.lastNames || "").trim(),
      dni: String(formValues?.dni || "").trim(),
      phone: String(formValues?.phone || "").trim(),
      gender: String(formValues?.gender || "").trim() || undefined,
      relationship: String(formValues?.relationship || "").trim(),
      isPrimary: Boolean(formValues?.isPrimary),
      livesWithStudent: Boolean(formValues?.livesWithStudent),
      notes: String(formValues?.notes || "").trim(),
    };

    if (!payload.names || !payload.lastNames || !payload.relationship) {
      setTutorManageError("Nombres, apellidos y relacion son obligatorios.");
      return;
    }

    setTutorManageError("");
    await updateTutorMutation.mutateAsync({ tutorId, payload });
    await queryClient.invalidateQueries({ queryKey: ["enrollments", "detail", enrollmentId] });
  }

  async function handleDeleteTutor(selectedTutor) {
    const tutorId = String(selectedTutor?.id || selectedTutor?._id || "").trim();
    if (!tutorId) {
      setTutorManageError("No se pudo identificar el tutor seleccionado.");
      return;
    }

    setTutorManageError("");
    await deleteTutorMutation.mutateAsync(tutorId);
    await queryClient.invalidateQueries({ queryKey: ["enrollments", "detail", enrollmentId] });
  }

  async function handleCreateTutor(formValues) {
    const payload = {
      studentId: activeStudentDetailId,
      names: String(formValues?.names || "").trim(),
      lastNames: String(formValues?.lastNames || "").trim(),
      dni: String(formValues?.dni || "").trim(),
      phone: String(formValues?.phone || "").trim(),
      relationship: String(formValues?.relationship || "").trim(),
      isPrimary: Boolean(formValues?.isPrimary),
      livesWithStudent: Boolean(formValues?.livesWithStudent),
      notes: String(formValues?.notes || "").trim(),
    };

    if (!payload.names || !payload.lastNames || !payload.relationship) {
      setTutorManageError("Nombres, apellidos y relacion son obligatorios.");
      return;
    }

    setTutorManageError("");
    await createTutorMutation.mutateAsync(payload);
    await queryClient.invalidateQueries({ queryKey: ["enrollments", "detail", enrollmentId] });
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
            {isAdmin ? (
              <SecondaryButton onClick={openMergeModal}>Fusionar matrícula</SecondaryButton>
            ) : null}
            {isAbsentEnrollment ? (
              <Button
                onClick={() => {
                  const params = new URLSearchParams({ resumeEnrollmentId: detail.id });
                  navigate(`${ROUTES.dashboardEnrollmentNew}?${params.toString()}`);
                }}
              >
                Matricular
              </Button>
            ) : (
              <>
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
              </>
            )}
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
                  {isAdmin ? (
                    <div className="mt-2">
                      <SecondaryButton
                        onClick={() => {
                          setIdentityFormError("");
                          setEditingIdentityStudentId(student.studentId || "");
                        }}
                      >
                        Editar alumno
                      </SecondaryButton>
                    </div>
                  ) : null}
                </div>
                <div className="text-sm text-gray-600">
                  <p>Derecho de ingreso: {formatMoney(student.admissionFee?.amount)}</p>
                  <p>Matrícula: {formatMoney(student.enrollmentFee?.amount)}</p>
                  <p>Pensión: {formatMoney(getMonthlyPensionAmount(student))}</p>
                  {isAdmin ? (
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <SecondaryButton onClick={() => openStudentCostsModal(student)}>Editar montos</SecondaryButton>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border border-gray-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Tutores firmantes</h2>
            <p className="mt-1 text-sm text-gray-500">Los tutores mostrados aquí participan en la matrícula y firma del contrato.</p>
          </div>
          {isAdmin ? (
            <div className="flex flex-wrap gap-2">
              {detail.students.map((student) => (
                <SecondaryButton
                  key={`manage-tutors-${student.enrollmentStudentId || student.studentId}`}
                  onClick={() => {
                    setTutorManageError("");
                    setManagingTutorsStudentId(student.studentId || "");
                  }}
                >
                  Editar tutores de {student.fullName || "alumno"}
                </SecondaryButton>
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-3 space-y-3">
          {detail.tutors.length ? detail.tutors.map((tutor) => (
            <div key={tutor.personId} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked readOnly className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">{tutor.fullName || "Tutor"}</p>
                  <p className="text-sm text-gray-600">
                    DNI: {tutor.dni || "-"} · Teléfono: {tutor.phone || "-"} · Parentesco: {tutor.relationship || "-"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-emerald-700">Tutor firmante</p>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-sm text-gray-500">No hay tutores relacionados para esta matrícula.</p>
          )}
        </div>
      </Card>

      {isAbsentEnrollment ? (
        <Card className="border border-amber-200 bg-amber-50">
          <h2 className="text-sm font-semibold text-amber-900">Contrato no disponible</h2>
          <p className="mt-2 text-sm text-amber-800">
            Esta matrícula está en estado Ausente. Completa el flujo de matrícula para registrar tutores, montos y generar el contrato.
          </p>
          <div className="mt-3">
            <Button
              onClick={() => {
                const params = new URLSearchParams({ resumeEnrollmentId: detail.id });
                navigate(`${ROUTES.dashboardEnrollmentNew}?${params.toString()}`);
              }}
            >
              Matricular
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Contrato</h2>
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>Dirección de contacto: {detail.contract?.address || "-"}</p>
            <p>Observaciones: {detail.contract?.notes || "-"}</p>
            <p>Fecha de contrato: {detail.contract?.confirmedAt ? String(detail.contract.confirmedAt).slice(0, 10) : "-"}</p>
          </div>
        </Card>
      )}

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

      <BaseModal
        open={isMergeModalOpen}
        onClose={() => !mergeMutation.isPending && setIsMergeModalOpen(false)}
        title="Fusionar matrículas (solo admin)"
        maxWidthClass="max-w-3xl"
        footer={(
          <div className="flex flex-wrap justify-end gap-2">
            <SecondaryButton onClick={() => setIsMergeModalOpen(false)} disabled={mergeMutation.isPending}>
              Cancelar
            </SecondaryButton>
            <Button onClick={handleMergeEnrollments} disabled={mergeMutation.isPending || !selectedSourceEnrollmentId}>
              {mergeMutation.isPending ? "Fusionando..." : "Fusionar"}
            </Button>
          </div>
        )}
      >
        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-gray-600">
            Matrícula destino: <span className="font-medium text-gray-900">{detail.id}</span>. Busca y selecciona la matrícula origen que quieres mover a esta.
          </p>

          <Input
            label="Buscar matrícula origen"
            value={mergeSearch}
            onChange={(e) => {
              setMergeSearch(e.target.value);
              setMergeError("");
            }}
            placeholder="DNI, nombre o código de alumno"
          />

          {mergeSearch.trim().length < 2 ? (
            <p className="text-sm text-gray-500">Escribe al menos 2 caracteres para buscar matrículas.</p>
          ) : mergeCandidatesQuery.isLoading ? (
            <p className="text-sm text-gray-500">Buscando matrículas...</p>
          ) : mergeCandidates.length ? (
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {mergeCandidates.map((row) => {
                const candidateId = row.enrollmentId;
                const student = row.student || {};
                const isSelected = String(candidateId) === String(selectedSourceEnrollmentId);
                return (
                  <button
                    key={`${candidateId}-${student.id || student.code || student.dni || "student"}`}
                    type="button"
                    onClick={() => {
                      setSelectedSourceEnrollmentId(candidateId);
                      setMergeError("");
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${isSelected ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                  >
                    <p className="font-medium text-gray-900">
                      Matrícula: {candidateId}
                    </p>
                    <p className="text-gray-600">
                      {student.lastNames}, {student.names} · DNI: {student.dni || "-"} · Código: {student.code || "-"}
                    </p>
                    <p className="text-gray-500">
                      Estado: {statusLabel(row.status)} · Campus: {row.campus?.name || row.campus?.code || "-"} · Ciclo: {row.cycle?.name || "-"}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No se encontraron matrículas para la búsqueda.</p>
          )}

          {selectedMergeCandidate ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p>
                Origen seleccionado: <span className="font-medium text-slate-900">{selectedMergeCandidate.enrollmentId}</span>
              </p>
              <p className="mt-1 text-slate-600">
                Esta acción moverá los alumnos de la matrícula origen a la destino y no se puede deshacer desde esta vista.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Nota de fusión (opcional)</label>
            <textarea
              rows={3}
              value={mergeNotes}
              onChange={(e) => setMergeNotes(e.target.value)}
              className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
              placeholder="Motivo o contexto de la fusión"
            />
          </div>

          {mergeError ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {mergeError}
            </div>
          ) : null}
        </div>
      </BaseModal>

      <BaseModal
        open={Boolean(editingStudent)}
        onClose={() => !updateStudentCostsMutation.isPending && setEditingStudent(null)}
        title="Editar montos del alumno"
        footer={(
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setEditingStudent(null)} disabled={updateStudentCostsMutation.isPending}>
              Cancelar
            </SecondaryButton>
            <Button onClick={handleSaveStudentCosts} disabled={updateStudentCostsMutation.isPending}>
              {updateStudentCostsMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        )}
      >
        <div className="space-y-4 p-5">
          <p className="text-sm text-gray-600">{editingStudent?.fullName || "Alumno"}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              label="Derecho de ingreso"
              type="number"
              min="0"
              step="0.01"
              value={studentCostsForm.admissionFeeAmount}
              onChange={(event) => setStudentCostsForm((prev) => ({ ...prev, admissionFeeAmount: event.target.value }))}
            />
            <Input
              label="Matrícula"
              type="number"
              min="0"
              step="0.01"
              value={studentCostsForm.enrollmentFeeAmount}
              onChange={(event) => setStudentCostsForm((prev) => ({ ...prev, enrollmentFeeAmount: event.target.value }))}
            />
            <Input
              label="Pensión"
              type="number"
              min="0"
              step="0.01"
              value={studentCostsForm.pensionAmount}
              onChange={(event) => setStudentCostsForm((prev) => ({ ...prev, pensionAmount: event.target.value }))}
            />
          </div>
          {studentCostsError ? <p className="text-sm text-red-600">{studentCostsError}</p> : null}
        </div>
      </BaseModal>

      <IdentityEditModal
        open={Boolean(editingIdentityStudentId)}
        onClose={() => {
          setIdentityFormError("");
          updateIdentityMutation.reset();
          setEditingIdentityStudentId("");
        }}
        student={activeStudent}
        onSave={handleSaveIdentity}
        saving={updateIdentityMutation.isPending}
        success={updateIdentityMutation.isSuccess}
        errorMessage={
          identityFormError ||
          (updateIdentityMutation.isError
            ? getErrorMessage(updateIdentityMutation.error, "No se pudo guardar la identidad")
            : "")
        }
      />

      <TutorsManageModal
        open={Boolean(managingTutorsStudentId)}
        onClose={() => {
          setTutorManageError("");
          updateTutorMutation.reset();
          deleteTutorMutation.reset();
          createTutorMutation.reset();
          setManagingTutorsStudentId("");
        }}
        tutors={activeTutors}
        canDelete={isAdmin}
        canCreate={isAdmin}
        onSaveTutor={handleSaveTutor}
        onDeleteTutor={handleDeleteTutor}
        onCreateTutor={handleCreateTutor}
        saving={updateTutorMutation.isPending}
        deleting={deleteTutorMutation.isPending}
        creating={createTutorMutation.isPending}
        success={updateTutorMutation.isSuccess || deleteTutorMutation.isSuccess || createTutorMutation.isSuccess}
        errorMessage={
          tutorManageError ||
          (updateTutorMutation.isError
            ? getErrorMessage(updateTutorMutation.error, "No se pudo actualizar el tutor.")
            : deleteTutorMutation.isError
              ? getErrorMessage(deleteTutorMutation.error, "No se pudo eliminar el tutor.")
              : createTutorMutation.isError
                ? getErrorMessage(createTutorMutation.error, "No se pudo vincular el tutor.")
                : "")
        }
      />
    </div>
  );
}
