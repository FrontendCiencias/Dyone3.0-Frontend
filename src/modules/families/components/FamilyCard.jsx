import React from "react";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { getFamilyIdLabel, getPrimaryTutorName } from "../domain/familyDisplay";
import { getThemeByCampusCode } from "../../../config/theme";

function resolveStudentVisual(student) {
  const status = String(student?.currentStatus || student?.status || student?.enrollmentStatus || "").toUpperCase();
  if (status.includes("EGRES")) {
    return { mode: "neutral" };
  }

  if (status.includes("TRASLAD") || status.includes("TRANSFER")) {
    return { mode: "neutral" };
  }

  const campusCode = student?.currentCampusCode || student?.campusCode || student?.campusAlias;
  if (!campusCode) {
    return { mode: "neutral" };
  }

  const theme = getThemeByCampusCode(campusCode);
  return {
    mode: "campus",
    backgroundColor: theme?.softBg,
    borderColor: theme?.softBg,
    textColor: theme?.dark,
  };
}

export default function FamilyCard({ family, onOpen }) {
  const familyId = getFamilyIdLabel(family);
  const studentsCount = Number(family?.studentsCount ?? family?.childrenCount ?? family?.students?.length ?? 0);
  const tutorsCount = Number(family?.tutorsCount || 0);
  const tutor = family?.primaryTutor || family?.primaryTutor_send || {};
  const students = family?.students || [];

  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase text-gray-500">Family ID: {familyId}</p>
          <div className="pt-1">
            <SecondaryButton onClick={onOpen}>Abrir</SecondaryButton>
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-900">Tutor principal: {getPrimaryTutorName(family)}</p>
        <p className="text-sm text-gray-600">DNI: {tutor?.dni || family?.dni || "-"} · Teléfono: {tutor?.phone || family?.phone || "-"}</p>
        <p className="text-sm text-gray-600">Hijos: {studentsCount} · Tutores: {Math.max(tutorsCount, 0)}</p>
        {students.length ? students.map((student, index) => {
          const visual = resolveStudentVisual(student);
          const isNeutral = visual.mode === "neutral";
          return (
            <div
              key={student.personId?._id || student.personId?.id || index}
              className={`text-sm flex items-center justify-between px-3 py-1 ${isNeutral ? "border-y border-gray-200 bg-gray-100" : ""}`}
              style={isNeutral ? undefined : {
                backgroundColor: visual.backgroundColor,
                borderTop: `1px solid ${visual.borderColor}`,
                borderBottom: `1px solid ${visual.borderColor}`,
              }}
            >
              <span className={isNeutral ? "text-gray-600" : ""} style={isNeutral ? undefined : { color: visual.textColor }}>
                {student?.personId?.lastNames?.toUpperCase() || ""},{" "}
                {student?.personId?.names || ""}
              </span>
              <span className="text-xs text-gray-600">
                {student?.personId?.dni || "-"}
              </span>
            </div>
          );
        }) : <p className="text-gray-500">Sin estudiantes registrados.</p>}
      </div>
    </Card>
  );
}
