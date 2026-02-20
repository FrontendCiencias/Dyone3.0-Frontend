import React, { useContext } from "react";
import { Check, Copy } from "lucide-react";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useClipboard } from "../../../shared/hooks/useClipboard";
import { getFamilyIdLabel, getPrimaryTutorName } from "../domain/familyDisplay";
import { ThemeContext, THEMES } from "../../../config/theme";

export default function FamilyCard({ family, onOpen }) {
  const { copied, copy } = useClipboard();
  const familyId = getFamilyIdLabel(family);
  const studentsCount = Number(family?.studentsCount ?? family?.childrenCount ?? family?.students?.length ?? 0);
  const tutorsCount = Number(family?.tutorsCount || 0);
  const tutor = family?.primaryTutor || family?.primaryTutor_send || {};
  const students = family?.students || [];

  
  const { theme } = useContext(ThemeContext);

  // const main = theme?.main || theme?.primary || "#DD6B20";
  const dark = theme?.dark || main;
  const softBg = theme?.softBg || "rgba(221,107,32,0.10)";

  console.log("[Family][dbg] content: ", family)
  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase text-gray-500">Family ID: {familyId}</p>
          {/* <button
            type="button"
            onClick={() => copy(familyId)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
            title={copied ? "Copiado" : "Copiar Family ID"}
            aria-label={copied ? "Copiado" : "Copiar Family ID"}
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button> */}
          <div className="pt-1">
            <SecondaryButton onClick={onOpen}>Abrir</SecondaryButton>
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-900">Tutor principal: {getPrimaryTutorName(family)}</p>
        <p className="text-sm text-gray-600">DNI: {tutor?.dni || family?.dni || "-"} · Teléfono: {tutor?.phone || family?.phone || "-"}</p>
        <p className="text-sm text-gray-600">Hijos: {studentsCount} · Tutores: {Math.max(tutorsCount, 0)}</p>
        {/* <p className="text-sm text-gray-600">Campus: {family?.campusCode || family?.campusAlias || "-"}</p> */}
        {students.length ? students.map((student, index) => {
          return (
            <div
              key={student.personId?._id || student.personId?.id || index}
              className="text-sm flex justify-between items-center px-3 py-1"
              style={{
                backgroundColor: softBg,
                borderTop: `1px solid ${softBg}`,
                borderBottom: `1px solid ${softBg}`,
              }}
            >
              <span className="text-gray-800">
                {student?.personId?.lastNames?.toUpperCase() || ""},{" "}
                {student?.personId?.names || ""}
              </span>
              <span className="text-gray-600 text-xs">
                {student?.personId?.dni || "-"}
              </span>
            </div>
          );
        }) : <p className="text-gray-500">Sin estudiantes registrados.</p>}
        {/* <div className="pt-1">
          <SecondaryButton onClick={onOpen}>Abrir</SecondaryButton>
        </div> */}
      </div>
    </Card>
  );
}
