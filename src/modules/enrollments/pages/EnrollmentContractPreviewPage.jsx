import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import SchoolLogo from "../../../shared/ui/SchoolLogo";

const MONTHS = ["Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function splitNames(fullName) {
  const [lastNamesRaw = "", namesRaw = ""] = String(fullName || "").split(",");
  const parts = String(lastNamesRaw).trim().split(/\s+/).filter(Boolean);
  return {
    paternalLastName: parts[0] || "",
    maternalLastName: parts.slice(1).join(" "),
    names: String(namesRaw).trim(),
  };
}

function getTutorLine(tutor) {
  const person = tutor?.tutorPerson || tutor?.person || {};
  return {
    fullName: [person?.names, person?.lastNames].filter(Boolean).join(" ").trim(),
    dni: person?.dni || "",
    phone: person?.phone || "",
    relationship: tutor?.relationship || "Apoderado",
  };
}

function normalizeContractData(raw) {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  const tutorContext = raw?.tutorContext || raw?.family || {};
  const tutors = (Array.isArray(raw?.tutors) ? raw.tutors : []).map(getTutorLine);

  const students = items.map((item) => {
    const parsed = splitNames(item?.fullName);
    const pensionMonthlyAmounts = Array.isArray(item?.pensionMonthlyAmounts)
      ? item.pensionMonthlyAmounts.map((amount) => Number(amount || 0))
      : Array(10).fill(0);

    return {
      paternalLastName: parsed.paternalLastName,
      maternalLastName: parsed.maternalLastName,
      names: parsed.names,
      fullName: item?.fullName || "",
      grade: item?.grade || "",
      level: item?.level || "",
      dni: item?.dni || "",
      campusCode: item?.campusCode || "",
      classroomLabel: item?.classroomLabel || "",
      previousSchoolType: item?.previousSchoolType || "",
      previousSchoolName: item?.previousSchoolName || "",
      admissionFeeAmount: item?.admissionFee?.applies && !item?.admissionFee?.isExempt ? Number(item?.admissionFee?.amount || 0) : 0,
      enrollmentFeeAmount: !item?.enrollmentFee?.isExempt ? Number(item?.enrollmentFee?.amount || 0) : 0,
      pensionMonthlyAmounts,
      pensionMonthlyReference: pensionMonthlyAmounts.length ? Math.max(...pensionMonthlyAmounts) : 0,
    };
  });

  const rights = students.reduce((acc, item) => acc + Number(item.admissionFeeAmount || 0), 0);
  const enrollment = students.reduce((acc, item) => acc + Number(item.enrollmentFeeAmount || 0), 0);
  const pensionByMonth = students.reduce((acc, item) => {
    item.pensionMonthlyAmounts.forEach((amount, idx) => {
      acc[idx] = Number(acc[idx] || 0) + Number(amount || 0);
    });
    return acc;
  }, Array(10).fill(0));
  const pensionMonthly = pensionByMonth.length ? Math.max(...pensionByMonth) : 0;

  return {
    enrollmentId: raw?.enrollmentId || "",
    campus: raw?.campus || "",
    city: raw?.city || "Majes",
    generatedAt: raw?.generatedAt || new Date().toISOString(),
    familyAddress: tutorContext?.address || tutorContext?.addressLine || "",
    tutors,
    students,
    rights,
    enrollment,
    pensionByMonth,
    pensionMonthly,
    notes: raw?.payments?.notes || "",
  };
}

function resolveStoragePayload(contractKey) {
  if (!contractKey) return null;

  try {
    const raw = localStorage.getItem(contractKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function EnrollmentContractPreviewPage() {
  const [params] = useSearchParams();
  const contractKey = params.get("contractKey") || "";

  const contractData = useMemo(() => {
    const payload = resolveStoragePayload(contractKey);
    return payload ? normalizeContractData(payload) : null;
  }, [contractKey]);

  if (!contractData) {
    return (
      <div className="mx-auto mt-8 max-w-3xl rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-gray-900">Contrato no disponible</h1>
        <p className="mt-2 text-sm text-gray-600">
          No se encontró la data de contrato para esta pestaña. Regresa a Nueva Matrícula y vuelve a abrir <strong>Ver contrato</strong>.
        </p>
      </div>
    );
  }

  const contractDate = new Date(contractData.generatedAt);
  const day = Number.isNaN(contractDate.getTime()) ? "__" : String(contractDate.getDate()).padStart(2, "0");
  const month = Number.isNaN(contractDate.getTime())
    ? "________"
    : contractDate.toLocaleDateString("es-PE", { month: "long" });
  const year = Number.isNaN(contractDate.getTime()) ? "2026" : contractDate.getFullYear();

  return (
    <>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 6mm;
          }

          @media print {
            html, body {
              background: #fff !important;
            }

            .no-print {
              display: none !important;
            }

            .a4-sheet {
              width: 100% !important;
              min-height: auto !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: 0 !important;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
        <div className="no-print mx-auto mb-3 flex w-[210mm] max-w-full justify-end gap-2 px-2">
          <SecondaryButton onClick={() => window.close()}>Cerrar</SecondaryButton>
          <Button onClick={() => window.print()}>Imprimir</Button>
        </div>

        <article className="a4-sheet mx-auto w-[210mm] max-w-full border border-gray-300 bg-white px-[8mm] py-[6mm] text-[10.6px] leading-tight text-black">
          <header className="grid grid-cols-[24mm_1fr] items-center gap-3">
            <div className="flex h-[20mm] items-center justify-center">
              <SchoolLogo className="h-[18mm] w-[18mm]" color="#000000" />
            </div>
            <h1 className="text-center text-[14px] font-bold uppercase tracking-[0.4px]">Contrato de pensiones de estudios - 2026</h1>
          </header>

          <section className="mt-2 space-y-1">
            <p className="font-semibold">Tutores firmantes</p>
            {contractData.tutors.length ? contractData.tutors.map((tutor, index) => (
              <p key={`tutor-line-${index}`}>
                <span className="font-medium">{tutor.relationship || "Apoderado"}:</span>{" "}
                <span className="border-b border-dotted border-black px-1 font-medium">
                  {tutor.fullName || "____________________________"}
                </span>
                {" · "}DNI <span className="border-b border-dotted border-black px-1">{tutor.dni || "________"}</span>
                {" · "}Cel. <span className="border-b border-dotted border-black px-1">{tutor.phone || "________"}</span>
              </p>
            )) : (
              <p>_______________________________________________</p>
            )}
            <p>
              Domiciliados en <span className="border-b border-dotted border-black px-1">{contractData.familyAddress || "_______________________________________________"}</span>.
            </p>
          </section>

          <section className="mt-2">
            <p>
              Celebramos este contrato de servicio de enseñanza con la I.E.P. CIENCIAS, representado por su promotor/director,
              matriculando a nuestros estudiantes para el año académico vigente.
            </p>
          </section>

          <section className="mt-2">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr>
                  <th className="border border-black px-1 py-0.5 text-left">APELLIDO PATERNO</th>
                  <th className="border border-black px-1 py-0.5 text-left">APELLIDO MATERNO</th>
                  <th className="border border-black px-1 py-0.5 text-left">NOMBRES</th>
                  <th className="border border-black px-1 py-0.5 text-center">GRADO</th>
                  <th className="border border-black px-1 py-0.5 text-center">NIVEL</th>
                  <th className="border border-black px-1 py-0.5 text-center">DNI</th>
                </tr>
              </thead>
              <tbody>
                {contractData.students.map((student, idx) => (
                  <tr key={`student-row-${idx}`}>
                    <td className="border border-black px-1 py-0.5">{student.paternalLastName || " "}</td>
                    <td className="border border-black px-1 py-0.5">{student.maternalLastName || " "}</td>
                    <td className="border border-black px-1 py-0.5">{student.names || " "}</td>
                    <td className="border border-black px-1 py-0.5 text-center">{student.grade || " "}</td>
                    <td className="border border-black px-1 py-0.5 text-center">{student.level || " "}</td>
                    <td className="border border-black px-1 py-0.5 text-center">{student.dni || " "}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-2 text-[10.2px]">
            <p className="font-semibold">Asumiendo los siguientes compromisos:</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>Todo alumno debe estar ASEGURADO (SIS, EsSalud u otro seguro privado) para cualquier emergencia, presentando constancia física en matrícula.</li>
              <li>Este año es de DISCIPLINA y responsabilidad; el alumno debe estudiar y cumplir tareas, y los tutores reforzar valores de respeto, obediencia y lealtad.</li>
              <li>Pagaremos puntualmente las pensiones hasta el día 30 de cada mes; en caso de retraso, asumimos la mora correspondiente.</li>
              <li>Asistiremos a todas las reuniones programadas y, de faltar, asumiremos la penalidad establecida por la institución.</li>
              <li>Respetamos el reglamento interno y nos comprometemos al buen uso de recursos, evitando responsabilizar al colegio por pérdidas no autorizadas.</li>
              <li>Nos comprometemos a apoyar el proceso educativo de nuestros menores, atendiendo llamadas y seguimiento académico permanente.</li>
              <li>Autorizamos a la I.E.P. el uso institucional de imágenes y material audiovisual del menor para fines educativos e informativos.</li>
            </ol>
          </section>

          <section className="mt-2 text-[10.2px]">
            <p>
              Cumpliremos con los siguientes pagos: Derecho de ingreso <span className="font-semibold">{formatMoney(contractData.rights)}</span> ·
              Matrícula <span className="font-semibold">{formatMoney(contractData.enrollment)}</span> ·
              Pensión mensual referencial <span className="font-semibold">{formatMoney(contractData.pensionMonthly)}</span>.
            </p>
            <table className="mt-1 w-full border-collapse text-[10px]">
              <thead>
                <tr>
                  {MONTHS.map((month) => (
                    <th key={`month-head-${month}`} className="border border-black px-1 py-0.5 text-center">{month.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {contractData.pensionByMonth.map((amount, idx) => (
                    <td key={`month-amount-${MONTHS[idx]}`} className="border border-black px-1 py-1 text-center text-[9.5px]">{amount ? formatMoney(amount) : "-"}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>

          <section className="mt-3 space-y-3 text-[10px]">
            <p className="font-semibold">Detalle económico por alumno</p>
            {contractData.students.map((student, studentIndex) => (
              <div key={`student-payment-${studentIndex}`} className="break-inside-avoid rounded border border-black p-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{student.fullName || "Alumno"}</p>
                    <p className="text-[9.5px]">
                      {student.level || "-"} · {student.grade || "-"} · {student.classroomLabel || "Sin salón"} · {student.campusCode || "Sin campus"}
                    </p>
                    <p className="text-[9.5px]">
                      Procedencia: {student.previousSchoolType === "OTHER" ? (student.previousSchoolName || "Otro colegio") : (student.previousSchoolType || "-")}
                    </p>
                  </div>
                  <div className="text-right text-[9.5px]">
                    <p>Derecho de ingreso: <span className="font-semibold">{formatMoney(student.admissionFeeAmount)}</span></p>
                    <p>Matrícula: <span className="font-semibold">{formatMoney(student.enrollmentFeeAmount)}</span></p>
                    <p>Pensión referencial: <span className="font-semibold">{formatMoney(student.pensionMonthlyReference)}</span></p>
                  </div>
                </div>
                <table className="mt-2 w-full border-collapse text-[9.3px]">
                  <thead>
                    <tr>
                      {MONTHS.map((month) => (
                        <th key={`student-${studentIndex}-${month}`} className="border border-black px-1 py-0.5 text-center">{month.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {student.pensionMonthlyAmounts.map((amount, idx) => (
                        <td key={`student-${studentIndex}-amount-${idx}`} className="border border-black px-1 py-1 text-center">
                          {amount ? formatMoney(amount) : "-"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </section>

          {contractData.notes ? (
            <section className="mt-2 text-[10.2px]">
              <p className="font-semibold">Observaciones</p>
              <p className="mt-1">{contractData.notes}</p>
            </section>
          ) : null}

          <section className="mt-2 text-[10.2px]">
            <p>
              Aclaramos que la vigencia del presente contrato es desde marzo hasta diciembre del año académico, tiempo en el cual buscamos alcanzar los fines educativos institucionales.
            </p>
            <p className="mt-1">
              Declarando conformidad, las partes ratifican su compromiso siendo su contenido la espontánea expresión de su voluntad.
            </p>
          </section>

          <section className="mt-2 flex justify-end text-[10.2px]">
            <p>
              {contractData.city}, {day} de {month} de {year}
            </p>
          </section>

          <footer className="mt-4 grid grid-cols-2 gap-4 text-center text-[10.2px]">
            {contractData.tutors.map((tutor, index) => (
              <div key={`signature-tutor-${index}`}>
                <p className="mx-auto w-[90%] border-t border-black pt-0.5">{tutor.fullName || " "}</p>
                <p>DNI: {tutor.dni || "________"}</p>
                <p>Cel.: {tutor.phone || "________"}</p>
                <p className="font-semibold">{String(tutor.relationship || "Apoderado").toUpperCase()}</p>
              </div>
            ))}
            <div>
              <p className="mx-auto w-[90%] border-t border-black pt-0.5">Mg. Juan Mesías Arizmendi Ortega</p>
              <p>DNI: 06811045</p>
              <p className="font-semibold">DIRECTOR</p>
            </div>
          </footer>
        </article>
      </div>
    </>
  );
}
