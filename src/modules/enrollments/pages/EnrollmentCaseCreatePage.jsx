import React, { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { useCyclesQuery } from "../../admin/hooks/useCyclesQuery";
import { useFamiliesSearchQuery } from "../../families/hooks/useFamiliesSearchQuery";
import { useFamilyDetailQuery } from "../../families/hooks/useFamilyDetailQuery";
import { getPrimaryTutorName, getStudents } from "../../families/domain/familyDisplay";
import { useQuickEnrollmentMutation } from "../hooks/useQuickEnrollmentMutation";
import { ENROLLMENT_CASE_MONTHS, buildPensionArrayFromGeneralAmount } from "../domain/enrollmentCaseValidation";
import { getClassroomOptions, getStudentCycleStatus } from "../../students/services/students.service";

const EXEMPT_SCHOOL_TYPES = new Set(["CIENCIAS", "CIENCIAS_APLICADAS", "CIMAS"]);

function getFamilyId(row) {
  return row?.id || row?._id || row?.familyId || "";
}

function getStudentId(student) {
  return student?.id || student?._id || student?.studentId || "";
}

function getStudentFullName(student) {
  const direct = student?.fullName || student?.studentFullName;
  if (direct) return direct;
  return [student?.personId?.lastNames, student?.personId?.names].filter(Boolean).join(", ") || "Alumno sin nombre";
}

function getStudentInternalCode(student) {
  return student?.internalCode || student?.code || student?.studentCode || "Sin código";
}

function resolveLevelGrade(student) {
  return {
    level: student?.level || student?.educationLevel || student?.currentLevel,
    grade: student?.grade || student?.currentGrade,
  };
}

function toMoney(value) {
  const safe = Number(value || 0);
  return `S/ ${Number.isNaN(safe) ? "0.00" : safe.toFixed(2)}`;
}

export default function EnrollmentCaseCreatePage() {
  const navigate = useNavigate();
  const [familyQuery, setFamilyQuery] = useState("");
  const [familyLocked, setFamilyLocked] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [agreements, setAgreements] = useState({});
  const [advancedPension, setAdvancedPension] = useState({});
  const [feedback, setFeedback] = useState("");

  const cyclesQuery = useCyclesQuery();
  const activeCycle = useMemo(() => {
    const rows = Array.isArray(cyclesQuery.data?.items) ? cyclesQuery.data.items : Array.isArray(cyclesQuery.data) ? cyclesQuery.data : [];
    return rows.find((cycle) => cycle?.isActive) || null;
  }, [cyclesQuery.data]);

  const familiesQuery = useFamiliesSearchQuery({
    q: familyQuery,
    enabled: !familyLocked && String(familyQuery).trim().length >= 2,
    limit: 8,
  });
  const familyRows = Array.isArray(familiesQuery.data?.items) ? familiesQuery.data.items : [];

  const familyId = getFamilyId(selectedFamily);
  const familyDetailQuery = useFamilyDetailQuery(familyId, Boolean(familyId));
  const familyStudents = useMemo(() => getStudents(familyDetailQuery.data), [familyDetailQuery.data]);

  useEffect(() => {
    if (!familyStudents.length) return;

    setAgreements((prev) => {
      const next = { ...prev };
      familyStudents.forEach((student) => {
        const studentId = getStudentId(student);
        if (!studentId || next[studentId]) return;
        // console.log("[DBG] [previousCampus] ", student)
        const previousSchoolType = student?.previousCampus || "Externo";
        const exempt = EXEMPT_SCHOOL_TYPES.has(previousSchoolType);
        next[studentId] = {
          include: false,
          classroomId: "",
          previousSchoolType,
          admissionFeeAmount: exempt ? 0 : 0,
          admissionFeeExempt: exempt,
          enrollmentFeeAmount: 0,
          enrollmentFeeExempt: false,
          enrollmentFeeExemptReason: "",
          pensionSimpleAmount: 0,
          pensionMonthlyAmounts: buildPensionArrayFromGeneralAmount(0, 0),
        };
      });
      return next;
    });
  }, [familyStudents]);

  const cycleStatusQueries = useQueries({
    queries: familyStudents.map((student) => {
      const studentId = getStudentId(student);
      return {
        queryKey: ["students", "cycle-status", studentId, activeCycle?.id],
        queryFn: () => getStudentCycleStatus(studentId, { cycleId: activeCycle?.id }),
        enabled: Boolean(studentId) && Boolean(activeCycle?.id),
        retry: false,
      };
    }),
  });

  const enrollmentMutation = useQuickEnrollmentMutation();

  const statusByStudentId = useMemo(() => {
    const map = {};
    familyStudents.forEach((student, index) => {
      const studentId = getStudentId(student);
      const query = cycleStatusQueries[index];
      const rows = Array.isArray(query?.data?.items) ? query.data.items : Array.isArray(query?.data?.studentCycles) ? query.data.studentCycles : Array.isArray(query?.data) ? query.data : [];
      const enrolled = rows.some((row) => String(row?.cycleId || row?.cycle?.id || "") === String(activeCycle?.id || "") && String(row?.status || "").toUpperCase() === "ENROLLED");
      map[studentId] = {
        enrolled,
        loading: query?.isLoading,
      };
    });
    return map;
  }, [familyStudents, cycleStatusQueries, activeCycle?.id]);

  const classroomQueries = useQueries({
    queries: familyStudents.map((student) => {
      const studentId = getStudentId(student);
      const item = agreements[studentId];
      const { level, grade } = resolveLevelGrade(student);

      return {
        queryKey: ["classroom-options", studentId, level, grade],
        queryFn: () => getClassroomOptions({ level, grade, includeCapacity: true }),
        enabled: Boolean(item?.include) && Boolean(level) && Boolean(grade),
        retry: false,
      };
    }),
  });

  const includedStudents = useMemo(
    () => familyStudents.filter((student) => agreements[getStudentId(student)]?.include),
    [familyStudents, agreements],
  );

  const summaryTotals = useMemo(() => {
    const admission = includedStudents.reduce((acc, student) => {
      const item = agreements[getStudentId(student)] || {};
      if (item.admissionFeeExempt) return acc;
      return acc + Number(item.admissionFeeAmount || 0);
    }, 0);

    const enrollment = includedStudents.reduce((acc, student) => {
      const item = agreements[getStudentId(student)] || {};
      if (item.enrollmentFeeExempt) return acc;
      return acc + Number(item.enrollmentFeeAmount || 0);
    }, 0);

    const monthly = includedStudents.reduce((acc, student) => {
      const item = agreements[getStudentId(student)] || {};
      const firstValid = (item.pensionMonthlyAmounts || []).find((value) => Number(value) >= 0);
      return acc + Number(firstValid || 0);
    }, 0);

    return { admission, enrollment, monthly };
  }, [includedStudents, agreements]);

  const validations = useMemo(() => {
    if (!activeCycle?.name) return "No existe ciclo activo configurado.";
    if (!familyId) return "Selecciona una familia.";
    if (!includedStudents.length) return "Selecciona al menos un alumno a matricular.";

    const missingClassroom = includedStudents.some((student) => !agreements[getStudentId(student)]?.classroomId);
    if (missingClassroom) return "Todos los alumnos incluidos deben tener un aula.";

    const missingAmounts = includedStudents.some((student) => {
      const item = agreements[getStudentId(student)];
      if (!item) return true;
      const pensionInvalid = !Array.isArray(item.pensionMonthlyAmounts) || item.pensionMonthlyAmounts.some((value) => Number.isNaN(Number(value)));
      if (pensionInvalid) return true;
      if (!item.admissionFeeExempt && Number(item.admissionFeeAmount) < 0) return true;
      if (!item.enrollmentFeeExempt && Number(item.enrollmentFeeAmount) < 0) return true;
      return false;
    });

    if (missingAmounts) return "Hay montos obligatorios pendientes o inválidos.";

    return "";
  }, [activeCycle?.id, familyId, includedStudents, agreements]);

  const canConfirm = !validations && !enrollmentMutation.isPending;

  const setAgreement = (studentId, patch) => {
    setAgreements((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), ...patch } }));
  };

  const selectFamily = (family) => {
    setSelectedFamily(family);
    setFamilyLocked(true);
    setFeedback("");
  };

  const resetFamily = () => {
    setFamilyLocked(false);
    setSelectedFamily(null);
    setAgreements({});
    setAdvancedPension({});
    setFamilyQuery("");
  };

  const confirmEnrollment = async () => {
    if (!canConfirm) {
      setFeedback(validations || "No se puede confirmar la matrícula.");
      return;
    }

    const payload = {
      familyId,
      cycleId: activeCycle.id,
      enrollmentStudents: includedStudents.map((student) => {
        const studentId = getStudentId(student);
        const item = agreements[studentId];
        return {
          studentId,
          classroomId: item.classroomId,
          admissionFee: {
            applies: !item.admissionFeeExempt,
            amount: item.admissionFeeExempt ? 0 : Number(item.admissionFeeAmount || 0),
            isExempt: Boolean(item.admissionFeeExempt),
          },
          enrollmentFee: {
            amount: item.enrollmentFeeExempt ? 0 : Number(item.enrollmentFeeAmount || 0),
            isExempt: Boolean(item.enrollmentFeeExempt),
            reason: item.enrollmentFeeExempt ? item.enrollmentFeeExemptReason || "Exoneración manual" : undefined,
          },
          pensionMonthlyAmounts: item.pensionMonthlyAmounts.map((value) => Number(value || 0)),
        };
      }),
    };

    try {
      await enrollmentMutation.mutateAsync(payload);
      navigate(ROUTES.dashboardEnrollments);
    } catch (error) {
      setFeedback(error?.response?.data?.message || "No se pudo confirmar la matrícula.");
    }
  };

  return (
    <div className="space-y-4 pb-10">
      <Card className="border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Nueva Matrícula</h1>
            <p className="text-sm text-gray-600">Flujo familiar de matrícula en ciclo activo.</p>
            <p className="mt-1 text-xs text-gray-500">Ciclo activo: <span className="font-semibold text-gray-700">{activeCycle?.name || activeCycle?.label || "No disponible"}</span></p>
          </div>
          <SecondaryButton onClick={() => navigate(ROUTES.dashboardEnrollments)}>Volver</SecondaryButton>
        </div>
      </Card>

      <Card className="relative border border-gray-200 shadow-sm">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Buscar familia"
              value={familyQuery}
              onChange={(event) => setFamilyQuery(event.target.value)}
              placeholder="Tutor, DNI o teléfono"
              disabled={familyLocked}
            />
          </div>
          {familyLocked ? <SecondaryButton onClick={resetFamily}>Cambiar familia</SecondaryButton> : null}
        </div>

        {!familyLocked && familyRows.length > 0 ? (
          <div className="absolute left-6 right-6 top-[88px] z-20 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
            {familyRows.map((family) => (
              <button
                key={getFamilyId(family)}
                type="button"
                className="mb-1 w-full rounded-md border border-transparent px-3 py-2 text-left text-sm hover:border-gray-200 hover:bg-gray-50"
                onClick={() => selectFamily(family)}
              >
                <p className="font-medium text-gray-900">{getPrimaryTutorName(family)}</p>
                <p className="text-xs text-gray-500">Alumnos: {(family?.students || []).slice(0, 3).map((student) => getStudentFullName(student)).join(" · ") || "Sin alumnos"}</p>
              </button>
            ))}
          </div>
        ) : null}
      </Card>

      {familyId ? (
        <Card className="space-y-4 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Alumnos de la familia</h2>

          {familyStudents.map((student, index) => {
            const studentId = getStudentId(student);
            const status = statusByStudentId[studentId] || {};
            const isInactive = student?.isActive === false;
            const blocked = status.enrolled || isInactive;
            const item = agreements[studentId] || {};
            const classroomRows = Array.isArray(classroomQueries[index]?.data?.items)
              ? classroomQueries[index].data.items
              : Array.isArray(classroomQueries[index]?.data)
                ? classroomQueries[index].data
                : [];

            return (
              <div key={studentId} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{getStudentFullName(student)}</p>
                    <p className="text-xs text-gray-500">{getStudentInternalCode(student)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    {status.loading ? <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">Validando ciclo...</span> : null}
                    {status.enrolled ? <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Ya matriculado</span> : null}
                    {isInactive ? <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">Inactivo</span> : null}
                  </div>
                </div>

                <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    disabled={blocked}
                    checked={Boolean(item.include) && !blocked}
                    onChange={(event) => setAgreement(studentId, { include: event.target.checked })}
                  />
                  Incluir en matrícula
                </label>

                {item.include && !blocked ? (
                  <div className="mt-3 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Aula</label>
                      <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={item.classroomId || ""}
                        onChange={(event) => setAgreement(studentId, { classroomId: event.target.value })}
                      >
                        <option value="">Selecciona aula</option>
                        {classroomRows.map((row) => {
                          const classroomId = row?.id || row?._id;
                          const disabled = String(row?.status || "").toUpperCase() === "FULL";
                          return (
                            <option key={classroomId} value={classroomId} disabled={disabled}>
                              {row?.label || row?.name} · {row?.campusCode || "--"} · Disp: {row?.available ?? "--"} · {row?.status || "OK"}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-gray-600">Colegio anterior: <span className="font-semibold">{item.previousSchoolType || "Externo"}</span></p>
                        <p className="text-xs text-gray-600">Derecho de ingreso: <span className="font-semibold">{item.admissionFeeExempt ? "Exonerado" : toMoney(item.admissionFeeAmount)}</span></p>
                        {!item.admissionFeeExempt ? (
                          <input
                            type="number"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={Number(item.admissionFeeAmount || 0)}
                            onChange={(event) => setAgreement(studentId, { admissionFeeAmount: Number(event.target.value || 0) })}
                            placeholder="Derecho de ingreso"
                          />
                        ) : null}
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Matrícula</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={Number(item.enrollmentFeeAmount || 0)}
                          onChange={(event) => setAgreement(studentId, { enrollmentFeeAmount: Number(event.target.value || 0) })}
                        />
                        <label className="mt-2 flex items-center gap-2 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={Boolean(item.enrollmentFeeExempt)}
                            onChange={(event) => setAgreement(studentId, { enrollmentFeeExempt: event.target.checked })}
                          />
                          Exonerar matrícula
                        </label>
                        {item.enrollmentFeeExempt ? (
                          <input
                            type="text"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
                            placeholder="Motivo de exoneración"
                            value={item.enrollmentFeeExemptReason || ""}
                            onChange={(event) => setAgreement(studentId, { enrollmentFeeExemptReason: event.target.value })}
                          />
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700">Pensión mensual</label>
                        <label className="flex items-center gap-2 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={Boolean(advancedPension[studentId])}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setAdvancedPension((prev) => ({ ...prev, [studentId]: checked }));
                              if (!checked) {
                                const amount = Number(item.pensionSimpleAmount || 0);
                                setAgreement(studentId, { pensionMonthlyAmounts: buildPensionArrayFromGeneralAmount(amount, 0) });
                              }
                            }}
                          />
                          Editar meses manualmente
                        </label>
                      </div>

                      {!advancedPension[studentId] ? (
                        <input
                          type="number"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={Number(item.pensionSimpleAmount || 0)}
                          onChange={(event) => {
                            const amount = Number(event.target.value || 0);
                            setAgreement(studentId, {
                              pensionSimpleAmount: amount,
                              pensionMonthlyAmounts: buildPensionArrayFromGeneralAmount(amount, 0),
                            });
                          }}
                        />
                      ) : (
                        <div className="grid gap-2 md:grid-cols-5">
                          {ENROLLMENT_CASE_MONTHS.map((month, monthIndex) => (
                            <label key={`${studentId}-${month}`} className="text-xs text-gray-600">
                              {month}
                              <input
                                type="number"
                                className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                                value={Number(item.pensionMonthlyAmounts?.[monthIndex] || 0)}
                                onChange={(event) => {
                                  const next = [...(item.pensionMonthlyAmounts || buildPensionArrayFromGeneralAmount(0, 0))];
                                  next[monthIndex] = Number(event.target.value || 0);
                                  setAgreement(studentId, { pensionMonthlyAmounts: next });
                                }}
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </Card>
      ) : null}

      {familyId ? (
        <Card className="border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Resumen final</h3>
          <p className="mt-1 text-sm text-gray-600">Familia: {familyId}</p>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            {includedStudents.map((student) => {
              const studentId = getStudentId(student);
              const item = agreements[studentId] || {};
              const classroomRows = classroomQueries[familyStudents.findIndex((row) => getStudentId(row) === studentId)]?.data?.items || [];
              const classroom = classroomRows.find((row) => String(row?.id || row?._id) === String(item.classroomId));
              return (
                <p key={`summary-${studentId}`}>
                  {getStudentFullName(student)} → {classroom?.label || "Aula pendiente"} ({item.previousSchoolType || "Otro"})
                </p>
              );
            })}
          </div>

          <div className="mt-4 grid gap-1 text-sm text-gray-800">
            <p>Derecho ingreso total: <span className="font-semibold">{toMoney(summaryTotals.admission)}</span></p>
            <p>Matrícula total: <span className="font-semibold">{toMoney(summaryTotals.enrollment)}</span></p>
            <p>Pensión mensual familiar estimada: <span className="font-semibold">{toMoney(summaryTotals.monthly)}</span></p>
          </div>

          {feedback ? <p className="mt-3 text-sm text-red-600">{feedback}</p> : null}

          <div className="mt-4 flex justify-end">
            <Button onClick={confirmEnrollment} disabled={!canConfirm}>Confirmar matrícula</Button>
          </div>
          {!canConfirm ? <p className="mt-2 text-xs text-amber-700">{validations}</p> : null}
        </Card>
      ) : null}
    </div>
  );
}
