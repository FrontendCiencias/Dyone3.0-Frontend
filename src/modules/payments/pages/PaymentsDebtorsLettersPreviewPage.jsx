import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { resolveDebtorsPrintPayload } from "../utils/debtorsPrintStorage";
import { renderCommunicationText } from "../utils/debtorsCommunicationTemplate";

function chunkItems(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function lineToHtml(line) {
  return line
    .replace(/saldo vencido/gi, "<strong>saldo vencido</strong>")
    .replace(/Conceptos vencidos:/gi, "<strong>Conceptos vencidos:</strong>")
    .replace(/La Direccion/g, "<strong>La Direccion</strong>");
}

function renderBodyLines(templateBody, item, generatedAt) {
  return renderCommunicationText(templateBody, item, generatedAt)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      html: lineToHtml(line),
      isSignature: /^Atentamente,?$/i.test(line) || /^La Direccion$/i.test(line),
    }));
}

function renderStudentLine(item) {
  return `Grado y Seccion: ${item?.classroomLabel || "-"}`;
}

export default function PaymentsDebtorsLettersPreviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const printKey = params.get("printKey") || "";

  const payload = useMemo(() => resolveDebtorsPrintPayload(printKey), [printKey]);
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const template = payload?.template || {};
  const sheets = useMemo(() => chunkItems(items, 8), [items]);

  return (
    <>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 4mm;
          }

          @media print {
            body {
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .print-controls {
              display: none !important;
            }

            .debtor-letters-sheet {
              page-break-after: always;
              break-after: page;
            }

            .debtor-letters-sheet:last-of-type {
              page-break-after: auto;
              break-after: auto;
            }
          }

          .debtor-letters-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 3mm;
          }

          .debtor-letter-card {
            height: 68mm;
            border: 1.2px solid #f97316;
            padding: 2.4mm;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .debtor-letter-header {
            display: grid;
            grid-template-columns: 1fr 13mm;
            align-items: start;
            gap: 2mm;
            margin-bottom: 1mm;
          }

          .debtor-letter-logo {
            width: 11mm;
            height: 11mm;
            object-fit: contain;
            filter: grayscale(1) brightness(0);
          }

          .debtor-letter-title {
            text-align: left;
            color: #f97316;
            font-weight: 700;
            font-size: 3.8mm;
            line-height: 1;
            text-transform: uppercase;
            text-decoration: underline;
            text-decoration-thickness: 0.25mm;
            text-underline-offset: 0.4mm;
          }

          .debtor-student-line {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 2.7mm;
            font-weight: 700;
            line-height: 1.15;
            margin-bottom: 0.4mm;
          }

          .debtor-student-name {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 2.6mm;
            font-weight: 700;
            line-height: 1.15;
            margin-bottom: 1mm;
          }

          .debtor-balance-line {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 3.3mm;
            font-weight: 700;
            line-height: 1.1;
            margin-bottom: 1mm;
            text-align: center;
          }

          .debtor-highlight-red {
            color: #dc2626;
          }

          .debtor-highlight-amber {
            color: #d97706;
          }

          .debtor-concepts {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 2.15mm;
            line-height: 1.2;
            color: #374151;
            margin-bottom: 1.2mm;
          }

          .debtor-concepts strong {
            font-weight: 700;
          }

          .debtor-letter-body {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 2.15mm;
            line-height: 1.22;
            color: #111827;
          }

          .debtor-letter-body p {
            margin: 0 0 1mm 0;
          }

          .debtor-letter-body p:last-child {
            margin-bottom: 0;
          }

          .debtor-letter-body p.debtor-signature {
            text-align: right;
          }
        `}
      </style>

      <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
        <div className="print-controls mx-auto mb-3 flex w-[210mm] max-w-full justify-end gap-2 px-2">
          <Button onClick={() => window.print()}>Imprimir</Button>
          <SecondaryButton onClick={() => window.close()}>Cerrar</SecondaryButton>
        </div>

        {!items.length ? (
          <div className="mx-auto w-[210mm] max-w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">Vista de impresion</h1>
            <p className="mt-2 text-base text-gray-600">No hay comunicados para imprimir.</p>
            <div className="mt-4">
              <SecondaryButton onClick={() => navigate(ROUTES.dashboardPaymentsDebtorsPrint)}>Volver a lista de deudores</SecondaryButton>
            </div>
          </div>
        ) : (
          <div className="space-y-[3mm] print:space-y-0">
            {sheets.map((sheetItems, sheetIndex) => (
              <section
                key={`sheet-${sheetIndex + 1}`}
                className="debtor-letters-sheet mx-auto w-[210mm] max-w-full bg-white p-[4mm] shadow-sm print:shadow-none"
              >
                <div className="debtor-letters-grid">
                  {sheetItems.map((item) => {
                    const bodyLines = renderBodyLines(template.body, item, payload?.generatedAt);
                    const conceptsSummary = Array.isArray(item?.conceptsSummary) ? item.conceptsSummary : [];
                    return (
                      <article key={item.studentId} className="debtor-letter-card">
                        <div className="debtor-letter-header">
                          <div className="debtor-letter-title">
                            {template.title || "Recordatorio de pago"}
                          </div>
                          <div className="flex justify-end">
                            <img src="/school-logo.svg" alt="Logo del colegio" className="debtor-letter-logo" />
                          </div>
                        </div>

                        <div className="debtor-student-line">{renderStudentLine(item)}</div>
                        <div className="debtor-student-name">Estudiante: {item.fullName || "-"}</div>

                        <div className="debtor-balance-line">
                          <span className="debtor-highlight-red">SALDO VENCIDO: </span>
                          <span className="debtor-highlight-amber">{formatMoney(item.totalOverdue)}</span>
                        </div>

                        <div className="debtor-concepts">
                          <strong>Conceptos:</strong>{" "}
                          {conceptsSummary.length
                            ? conceptsSummary
                              .filter((entry) => Number(entry?.overdueAmount || 0) > 0)
                              .map((entry) => `${entry.label} (${formatMoney(entry.overdueAmount)})`)
                              .join(", ")
                            : "-"}
                        </div>

                        <div className="debtor-letter-body">
                          {bodyLines.map((line, index) => (
                            <p
                              key={`${item.studentId}-${index}`}
                              className={line.isSignature ? "debtor-signature" : undefined}
                              dangerouslySetInnerHTML={{ __html: line.html }}
                            />
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
