function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildLogoSvg(color) {
  return `
    <svg viewBox="0 0 493 502" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M258.566 502C224.05 502.077 189.855 495.377 157.922 482.279C142.58 475.977 127.873 468.227 114.002 459.136C100.307 450.152 87.4957 439.89 75.7402 428.487C64.0519 417.142 53.4794 404.703 44.1683 391.339C34.8419 377.946 26.8561 363.667 20.3264 348.711C6.86732 317.895 -0.0538319 284.625 -0.000178714 251C-0.0538319 217.376 6.86732 184.105 20.3264 153.289C26.8546 138.33 34.8395 124.049 44.1653 110.652C53.4748 97.29 64.0452 84.8514 75.7313 73.5073C87.4868 62.1043 100.298 51.842 113.993 42.8584C127.867 33.7689 142.575 26.0216 157.919 19.7216C189.853 6.62326 224.049 -0.0773862 258.566 0.000182875C308.339 -0.112186 357.124 13.8878 399.259 40.3753C419.4 53.0663 437.686 68.4861 453.593 86.1948C469.443 103.826 482.71 123.616 492.997 144.974C450.918 92.3532 382.839 60.9364 310.877 60.9364C187.258 60.9364 86.6867 151.407 86.6867 262.609C86.6867 373.811 187.258 464.279 310.877 464.279C359.426 464.633 406.929 450.174 447.041 422.831C435.193 435.063 422.165 446.093 408.145 455.762C393.954 465.543 378.827 473.894 362.987 480.692C346.809 487.626 329.974 492.917 312.736 496.484C294.914 500.158 276.763 502.006 258.566 502Z" fill="${color}"/>
      <path d="M254.874 439.645C235.726 435.298 217.443 427.769 200.788 417.371C184.825 407.376 170.695 394.72 159.011 379.951C147.287 365.1 138.183 348.359 132.09 330.448C125.705 311.596 122.483 291.819 122.554 271.917C122.528 248.26 127.537 224.868 137.249 203.295C146.763 182.156 160.37 163.11 177.287 147.256C194.514 131.022 214.666 118.201 236.673 109.475C259.804 100.263 284.484 95.5599 309.383 95.6192C323.284 95.6132 337.147 97.0665 350.744 99.9549C363.85 102.749 376.63 106.897 388.877 112.332C400.817 117.635 412.177 124.157 422.775 131.796C433.193 139.309 442.797 147.891 451.429 157.401C449.214 156.364 446.895 155.33 444.533 154.326C417.215 142.861 387.882 136.961 358.253 136.974C282.028 136.974 216.448 175.374 191.213 234.802C161.241 305.38 186.825 387.7 254.883 439.639L254.874 439.645Z" fill="${color}"/>
      <path d="M292.942 301.798H260.061V412.357H292.942V301.798Z" fill="${color}"/>
      <path d="M331.801 373.512V340.643H221.201V373.512H331.801Z" fill="${color}"/>
      <path d="M418.488 301.798H385.607V412.357H418.488V301.798Z" fill="${color}"/>
      <path d="M457.348 373.512V340.643H346.747V373.512H457.348Z" fill="${color}"/>
    </svg>
  `;
}

function resolveMethodLabel(method) {
  if (method === "CASH") return "Efectivo";
  if (method === "YAPE") return "Yape";
  if (method === "TRANSFER") return "Transferencia";
  return method || "-";
}

function buildAllocationRows(payment) {
  const allocations = Array.isArray(payment?.allocations) ? payment.allocations : [];
  if (!allocations.length) {
    return `
      <tr>
        <td class="cell">Pago registrado</td>
        <td class="cell amount">${escapeHtml(formatMoney(payment?.amount))}</td>
      </tr>
    `;
  }

  return allocations
    .map((allocation) => {
      const partialBadge = allocation?.isPartial
        ? `<div class="partial-tag">Pago parcial</div>`
        : "";
      return `
        <tr>
          <td class="cell">
            <div>${escapeHtml(allocation.concept || "Cargo")}</div>
            ${partialBadge}
          </td>
          <td class="cell amount">${escapeHtml(formatMoney(allocation.amount))}</td>
        </tr>
      `;
    })
    .join("");
}

function buildReceiptHtml({ student, payment }) {
  const studentName = [student?.lastNames, student?.names].filter(Boolean).join(", ") || "Alumno";

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Recibo ${escapeHtml(payment?.internalCode || "")}</title>
        <style>
          @page {
            size: 80mm 210mm;
            margin: 5mm;
          }

          body {
            margin: 0;
            background: #f3f4f6;
            color: #111111;
            font-family: Arial, sans-serif;
          }

          .page {
            min-height: 100vh;
            padding: 20px 0;
            background: #f3f4f6;
          }

          .toolbar {
            width: 80mm;
            max-width: calc(100vw - 20px);
            margin: 0 auto 10px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }

          .button {
            border: 1px solid #111111;
            background: #ffffff;
            color: #111111;
            border-radius: 10px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }

          .button-primary {
            background: #111111;
            color: #ffffff;
          }

          .sheet {
            width: 80mm;
            min-height: 210mm;
            max-width: calc(100vw - 20px);
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
            box-sizing: border-box;
            padding: 8mm 6mm;
            display: flex;
            flex-direction: column;
          }

          .content {
            display: flex;
            flex-direction: column;
            min-height: calc(210mm - 16mm);
            flex: 1;
          }

          .content-main {
            display: block;
          }

          .center {
            text-align: center;
          }

          .logo {
            width: 20mm;
            height: 20mm;
            margin: 0 auto 8px;
          }

          .title {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .subtitle {
            margin: 2px 0 0;
            font-size: 10px;
          }

          .address {
            margin: 8px 0 0;
            font-size: 10px;
            line-height: 1.35;
          }

          .rule {
            border-top: 1px dashed #111111;
            margin: 8px 0;
          }

          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }

          .meta {
            border: 1px solid #111111;
            padding: 6px;
            min-height: 34px;
          }

          .meta-label {
            display: block;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 2px;
          }

          .meta-value {
            font-size: 11px;
            line-height: 1.35;
            word-break: break-word;
          }

          .section-title {
            margin: 10px 0 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          .cell {
            border: 1px solid #111111;
            padding: 6px 5px;
            font-size: 10px;
            vertical-align: top;
          }

          .amount {
            text-align: right;
            white-space: nowrap;
          }

          .partial-tag {
            margin-top: 3px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .total-box {
            margin-top: 10px;
            border: 1.5px solid #111111;
            padding: 8px;
          }

          .total-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .total-value {
            margin-top: 3px;
            font-size: 18px;
            font-weight: 700;
            text-align: right;
          }

          .signature {
            margin-top: auto;
            padding-top: 10px;
            border-top: 1px dashed #111111;
            text-align: center;
            font-size: 9px;
          }

          @media print {
            body, .page {
              background: #ffffff !important;
              padding: 0 !important;
            }

            .toolbar {
              display: none !important;
            }

            .sheet {
              width: 100% !important;
              max-width: none !important;
              height: 200mm !important;
              min-height: 200mm !important;
              margin: 0 !important;
              box-shadow: none !important;
            }

            .content {
              height: 100% !important;
              min-height: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="toolbar">
            <button class="button" onclick="window.close()">Cerrar</button>
            <button class="button button-primary" onclick="window.print()">Imprimir</button>
          </div>

          <article class="sheet">
            <div class="content">
              <div class="content-main">
                <div class="center">
                  <div class="logo">${buildLogoSvg("#000000")}</div>
                  <p class="title">Colegios Ciencias y Cimas</p>
                  <p class="subtitle">Recibo de pago</p>
                  <p class="address">
                    Calle Cayma Mz. V Lote 12 El Pedregal<br />
                    Pedregal - Majes - Caylloma - Arequipa
                  </p>
                </div>

                <div class="rule"></div>

                <div class="grid">
                  <div class="meta">
                    <span class="meta-label">Codigo interno</span>
                    <div class="meta-value">${escapeHtml(payment?.internalCode || "-")}</div>
                  </div>
                  <div class="meta">
                    <span class="meta-label">Fecha</span>
                    <div class="meta-value">${escapeHtml(formatDate(payment?.date || payment?.paidAt))}</div>
                  </div>
                  <div class="meta" style="grid-column: span 2;">
                    <span class="meta-label">Metodo</span>
                    <div class="meta-value">${escapeHtml(resolveMethodLabel(payment?.method))}</div>
                  </div>
                </div>

                <p class="section-title">Estudiante</p>
                <div class="meta">
                  <span class="meta-label">Nombre completo</span>
                  <div class="meta-value">${escapeHtml(studentName)}</div>
                </div>
                <div class="grid" style="margin-top:6px;">
                  <div class="meta">
                    <span class="meta-label">DNI</span>
                    <div class="meta-value">${escapeHtml(student?.dni || "-")}</div>
                  </div>
                  <div class="meta">
                    <span class="meta-label">Codigo alumno</span>
                    <div class="meta-value">${escapeHtml(student?.code || "-")}</div>
                  </div>
                </div>

                <p class="section-title">Detalle</p>
                <table>
                  <thead>
                    <tr>
                      <th class="cell">Concepto</th>
                      <th class="cell amount">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${buildAllocationRows(payment)}
                  </tbody>
                </table>

                <div class="total-box">
                  <div class="total-label">Total pagado</div>
                  <div class="total-value">${escapeHtml(formatMoney(payment?.amount))}</div>
                </div>

                <p class="section-title">Observaciones</p>
                <div class="meta">
                  <div class="meta-value">${escapeHtml(payment?.note || "Documento emitido desde la plataforma web institucional.")}</div>
                </div>
              </div>

              <div class="signature">
                Cancelado<br />
                Colegios Ciencias y Cimas
              </div>
            </div>
          </article>
        </div>
      </body>
    </html>
  `;
}

export function printPaymentReceipt({ student, payment }) {
  const popup = window.open("", "_blank");
  if (!popup) return false;

  popup.document.open();
  popup.document.write(buildReceiptHtml({ student, payment }));
  popup.document.close();
  popup.focus();
  return true;
}
