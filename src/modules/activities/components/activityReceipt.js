function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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

function buildReceiptHtml({ activity, student, collection }) {
  const studentName = [student?.lastNames, student?.names].filter(Boolean).join(", ") || "Alumno";
  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(collection?.receiptInternalCode || "Recibo Activity")}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; background: #f3f4f6; color: #111; }
          .page { max-width: 360px; margin: 24px auto; background: #fff; padding: 24px; box-shadow: 0 12px 28px rgba(0,0,0,.14); }
          .title { font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 0; }
          .sub { color: #666; font-size: 12px; margin-top: 4px; }
          .rule { margin: 16px 0; border-top: 1px dashed #999; }
          .meta { border: 1px solid #ddd; border-radius: 10px; padding: 10px; margin-bottom: 8px; }
          .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; }
          .value { font-size: 14px; margin-top: 3px; }
          .total { margin-top: 16px; border: 1.5px solid #111; border-radius: 12px; padding: 12px; }
          .total-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6b7280; }
          .total-value { font-size: 24px; font-weight: 700; text-align: right; margin-top: 6px; }
          .toolbar { display: flex; justify-content: flex-end; gap: 8px; margin: 0 auto 10px; max-width: 360px; }
          .button { border: 1px solid #111; background: #fff; color: #111; border-radius: 10px; padding: 8px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }
          .button.primary { background: #111; color: #fff; }
          @media print { .toolbar { display: none !important; } body { background: #fff; } .page { box-shadow: none; margin: 0 auto; } }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button class="button" onclick="window.close()">Cerrar</button>
          <button class="button primary" onclick="window.print()">Imprimir</button>
        </div>
        <article class="page">
          <p class="title">Recibo de Activity</p>
          <p class="sub">${escapeHtml(activity?.name || "Activity")} · ${escapeHtml(activity?.campus?.name || activity?.campus?.code || "-")}</p>
          <div class="rule"></div>
          <div class="meta"><div class="label">Recibo</div><div class="value">${escapeHtml(collection?.receiptInternalCode || "-")}</div></div>
          <div class="meta"><div class="label">Fecha</div><div class="value">${escapeHtml(formatDateTime(collection?.collectedAt))}</div></div>
          <div class="meta"><div class="label">Método</div><div class="value">${escapeHtml(collection?.methodLabel || collection?.method || "-")}</div></div>
          <div class="meta"><div class="label">Alumno</div><div class="value">${escapeHtml(studentName)}</div></div>
          <div class="meta"><div class="label">Código alumno</div><div class="value">${escapeHtml(student?.internalCode || "-")}</div></div>
          <div class="meta"><div class="label">DNI</div><div class="value">${escapeHtml(student?.dni || "-")}</div></div>
          <div class="meta"><div class="label">Registrado por</div><div class="value">${escapeHtml(collection?.collectorName || "-")} · ${escapeHtml(collection?.collectorRole || "-")}</div></div>
          <div class="total">
            <div class="total-label">Total pagado</div>
            <div class="total-value">${escapeHtml(formatMoney(collection?.amount))}</div>
          </div>
        </article>
      </body>
    </html>
  `;
}

export function printActivityReceipt({ activity, student, collection }) {
  const popup = window.open("", "_blank");
  if (!popup) return false;
  popup.document.open();
  popup.document.write(buildReceiptHtml({ activity, student, collection }));
  popup.document.close();
  popup.focus();
  return true;
}
