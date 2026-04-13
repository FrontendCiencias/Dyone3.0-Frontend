import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { resolveCajaArequipaPrintPayload } from "../utils/cajaArequipaPrintStorage";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default function PaymentsCajaArequipaPrintPreviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const printKey = params.get("printKey") || "";

  const payload = useMemo(() => resolveCajaArequipaPrintPayload(printKey), [printKey]);
  const items = Array.isArray(payload?.items) ? payload.items : [];

  return (
    <>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 14mm 12mm;
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

            table {
              page-break-inside: auto;
              width: 100%;
            }

            thead {
              display: table-header-group;
            }

            tr,
            td,
            th {
              break-inside: avoid;
              page-break-inside: avoid;
            }
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
            <p className="mt-2 text-base text-gray-600">No hay filas disponibles para imprimir.</p>
            <div className="mt-4">
              <SecondaryButton onClick={() => navigate(ROUTES.dashboardPaymentsCajaArequipa)}>Volver a Caja Arequipa</SecondaryButton>
            </div>
          </div>
        ) : (
          <section className="mx-auto w-[210mm] max-w-full bg-white p-[12mm] shadow-sm print:shadow-none">
            <header className="border-b border-gray-300 pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Lista Caja Arequipa</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span>Generado el {formatDate(payload?.generatedAt)}</span>
                    <span>Campus: {payload?.campusLabel || "-"}</span>
                    <span>Filas incluidas: {items.length}</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full text-[11px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Estado</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Fecha</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Cod. CA</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Alumno PDF</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Alumno web</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Mes</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Pension</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Total PDF</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Comision</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Mora</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${item.rowIndex || index}-${item.fingerprint || index}`} className="border-t border-gray-100">
                      <td className="px-2 py-2 text-gray-900">{item.statusLabel || "-"}</td>
                      <td className="px-2 py-2 text-gray-700">{formatDate(item.paidAt)}</td>
                      <td className="px-2 py-2 text-gray-700">{item.bankCode || "-"}</td>
                      <td className="px-2 py-2 text-gray-700">{item.pdfStudentName || "-"}</td>
                      <td className="px-2 py-2 text-gray-700">{item.studentFullName || "-"}</td>
                      <td className="px-2 py-2 text-gray-700">{item.monthLabel || "-"}</td>
                      <td className="px-2 py-2 font-medium text-gray-900">{formatMoney(item.expectedTuitionAmount || 0)}</td>
                      <td className="px-2 py-2 font-medium text-gray-900">{formatMoney(item.reportedAmount || 0)}</td>
                      <td className="px-2 py-2 text-gray-700">{formatMoney(item.commissionAmount || 0)}</td>
                      <td className="px-2 py-2 text-gray-700">{formatMoney(item.moraAmount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
