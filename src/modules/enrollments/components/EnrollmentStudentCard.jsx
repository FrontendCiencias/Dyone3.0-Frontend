import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useClassroomCapacityQuery } from "../../students/hooks/useClassroomCapacityQuery";
import MonthlyPensionEditor from "./MonthlyPensionEditor";
import {
  ENROLLMENT_CASE_MONTHS,
  applyStartIndexToPensionArray,
  buildPensionArrayFromGeneralAmount,
  normalizePensionArray,
} from "../domain/enrollmentCaseValidation";

const PREVIOUS_TYPES = ["CIMAS", "CIENCIAS", "CIENCIAS_APLICADAS", "OTHER"];

export default function EnrollmentStudentCard({
  student,
  data,
  classrooms,
  onChange,
  onRemove,
  onOpenDetail,
  onCapacityStateChange,
  errors = [],
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const capacityQuery = useClassroomCapacityQuery(data?.classroomId, Boolean(data?.classroomId));

  const capacityData = useMemo(() => {
    const source = capacityQuery.data;
    const capacity = Number(source?.capacity ?? source?.total ?? source?.vacanciesTotal);
    const occupied = Number(source?.occupied ?? source?.enrolled ?? source?.enrolledCount ?? source?.matriculated);
    const reserved = Number(source?.reserved ?? source?.vacanciesReserved ?? source?.reservedSeats ?? 0);
    const available = Number(source?.available ?? source?.vacanciesAvailable ?? source?.remaining);

    return {
      capacity: Number.isNaN(capacity) ? null : capacity,
      occupied: Number.isNaN(occupied) ? null : occupied,
      reserved: Number.isNaN(reserved) ? null : reserved,
      available: Number.isNaN(available) ? null : available,
    };
  }, [capacityQuery.data]);

  useEffect(() => {
    onCapacityStateChange?.(data?.localId, {
      isLoading: Boolean(data?.classroomId) && capacityQuery.isFetching,
      isError: Boolean(data?.classroomId) && capacityQuery.isError,
      available: capacityData.available,
    });
  }, [data?.localId, data?.classroomId, capacityQuery.isFetching, capacityQuery.isError, capacityData.available, onCapacityStateChange]);

  const handleGeneralPension = (value) => {
    const amount = Number(value || 0);
    const startIndex = Number(data?.startMonthIndex || 0);

    onChange({
      pensionGeneral: amount,
      isPensionCustomized: false,
      pensionMonthlyAmounts: buildPensionArrayFromGeneralAmount(amount, startIndex),
    });
  };

  const handleStartMonthChange = (nextStartIndexValue) => {
    const startMonthIndex = Number(nextStartIndexValue || 0);
    const normalizedPension = normalizePensionArray(data?.pensionMonthlyAmounts, 0);

    onChange({
      startMonthIndex,
      pensionMonthlyAmounts: data?.isPensionCustomized
        ? applyStartIndexToPensionArray(normalizedPension, startMonthIndex)
        : buildPensionArrayFromGeneralAmount(Number(data?.pensionGeneral || 0), startMonthIndex),
    });
  };

  const appliesAdmission = data?.previousSchoolType === "OTHER";
  const hasCapacityError = Boolean(data?.classroomId) && capacityQuery.isError;
  const noCapacity = !capacityQuery.isFetching && !hasCapacityError && Number(capacityData.available) <= 0;

  return (
    <Card className={`border shadow-sm ${errors.length ? "border-red-200 bg-red-50/20" : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{student?.lastNames}, {student?.names}</p>
          <p className="text-xs text-gray-600">DNI: {student?.dni || "-"} · Código: {student?.code || student?.internalCode || "-"}</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={onOpenDetail}>Abrir expediente</SecondaryButton>
          <SecondaryButton className="border-red-200 text-red-700" onClick={onRemove}>Quitar</SecondaryButton>
        </div>
      </div>

      {errors.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-red-700">
          {errors.map((error, index) => <li key={`${data?.localId}-error-${index}`}>{error}</li>)}
        </ul>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Salón</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={data?.classroomId || ""}
            onChange={(e) => onChange({ classroomId: e.target.value })}
          >
            <option value="">Selecciona salón</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.displayName || `${classroom.grade || ""} - ${classroom.section || ""}`}
              </option>
            ))}
          </select>
          <p className={`mt-1 text-xs ${hasCapacityError || noCapacity ? "text-red-700" : "text-gray-600"}`}>
            {capacityQuery.isFetching
              ? "Consultando cupos..."
              : hasCapacityError
                ? "No se pudo consultar cupos"
                : noCapacity
                  ? "Sin cupos"
                  : `Cap: ${capacityData.capacity ?? "-"} · Ocup: ${capacityData.occupied ?? "-"} · Reservadas: ${capacityData.reserved ?? "-"} · Disp: ${capacityData.available ?? "-"}`}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Procedencia</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={data?.previousSchoolType || "CIMAS"}
            onChange={(e) => onChange({ previousSchoolType: e.target.value })}
          >
            {PREVIOUS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          {data?.previousSchoolType === "OTHER" ? (
            <Input label="Nombre colegio anterior" value={data?.previousSchoolName || ""} onChange={(e) => onChange({ previousSchoolName: e.target.value })} />
          ) : null}
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-sm font-medium text-gray-800">Matrícula fee</p>
          <Input label="Monto" type="number" value={data?.enrollmentFeeAmount || 0} onChange={(e) => onChange({ enrollmentFeeAmount: Number(e.target.value || 0) })} disabled={Boolean(data?.enrollmentFeeExempt)} />
          <label className="mt-1 flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={Boolean(data?.enrollmentFeeExempt)} onChange={(e) => onChange({ enrollmentFeeExempt: e.target.checked })} />Exonerado</label>
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-sm font-medium text-gray-800">Derecho de ingreso</p>
          {appliesAdmission ? (
            <>
              <Input label="Monto" type="number" value={data?.admissionFeeAmount || 0} onChange={(e) => onChange({ admissionFeeAmount: Number(e.target.value || 0) })} disabled={Boolean(data?.admissionFeeExempt)} />
              <label className="mt-1 flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={Boolean(data?.admissionFeeExempt)} onChange={(e) => onChange({ admissionFeeExempt: e.target.checked })} />Exonerado</label>
            </>
          ) : (
            <p className="text-xs text-gray-600">Alumno del sistema (no aplica)</p>
          )}
        </div>

        <div className="md:col-span-2 rounded-lg border border-gray-200 p-3">
          <div className="grid gap-3 md:grid-cols-3 md:items-end">
            <Input label="Monto general pensión" type="number" value={data?.pensionGeneral || 0} onChange={(e) => handleGeneralPension(e.target.value)} />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Empieza a pagar desde</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={String(data?.startMonthIndex ?? 0)} onChange={(e) => handleStartMonthChange(e.target.value)}>
                {ENROLLMENT_CASE_MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
              </select>
            </div>
            <div>
              <SecondaryButton onClick={() => setEditorOpen(true)}>Personalizar pensiones</SecondaryButton>
            </div>
          </div>
        </div>
      </div>

      <MonthlyPensionEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        values={normalizePensionArray(data?.pensionMonthlyAmounts, -1)}
        onChange={(index, value) => {
          const copy = normalizePensionArray(data?.pensionMonthlyAmounts, 0);
          if (copy[index] === -1) return;
          copy[index] = value;
          onChange({ pensionMonthlyAmounts: copy, isPensionCustomized: true });
        }}
      />
    </Card>
  );
}
