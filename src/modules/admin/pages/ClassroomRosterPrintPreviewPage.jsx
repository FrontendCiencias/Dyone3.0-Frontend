import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import logoPng from "../../../assets/logopng.png";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { resolveClassroomRosterPrintPayload } from "../utils/classroomRosterPrintStorage";

const PERIOD_COLUMNS = [
  { key: "p1", label: "PERIODO 1" },
  { key: "p2", label: "PERIODO 2" },
  { key: "p3", label: "PERIODO 3" },
  { key: "p4", label: "PERIODO 4" },
];

const SUBCOLUMNS = ["Rev. Cuaderno", "Rev. Libro", "Examen", "Actitud frente al area", "Puntos de evaluacion", "Calif."];
const SUMMARY_COLUMNS = ["Rev. Cuaderno", "Rev. Libro", "Examen", "Actitud frente al area", "Puntos de evaluacion", "Calif."];
const LOGO_SRC = logoPng;

const EXCEL_TOTAL_COLUMNS = 34;
const EXCEL_BORDER = {
  top: { style: "thin", color: { argb: "FF6B7280" } },
  left: { style: "thin", color: { argb: "FF6B7280" } },
  bottom: { style: "thin", color: { argb: "FF6B7280" } },
  right: { style: "thin", color: { argb: "FF6B7280" } },
};
const EXCEL_HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4D4D4" } };
const EXCEL_SUBHEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
const EXCEL_GRADE_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4D4D4" } };

function getRosterRows(students) {
  return students.length ? students : Array.from({ length: 18 }, () => ({ names: "", lastNames: "" }));
}

function setExcelCellStyle(cell, overrides = {}) {
  cell.border = overrides.border || EXCEL_BORDER;
  cell.font = overrides.font || { name: "Arial", size: 9, color: { argb: "FF000000" } };
  cell.alignment = overrides.alignment || { vertical: "middle", horizontal: "center" };
  if (overrides.fill) cell.fill = overrides.fill;
}

function styleExcelRange(worksheet, startRow, endRow, startCol, endCol, overrides = {}) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      setExcelCellStyle(worksheet.getCell(row, col), overrides);
    }
  }
}

function buildEdgeBorder({ top = false, left = false, bottom = false, right = false }) {
  return {
    top: top ? EXCEL_BORDER.top : undefined,
    left: left ? EXCEL_BORDER.left : undefined,
    bottom: bottom ? EXCEL_BORDER.bottom : undefined,
    right: right ? EXCEL_BORDER.right : undefined,
  };
}

function styleExcelBox(worksheet, startRow, endRow, startCol, endCol, overrides = {}) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      setExcelCellStyle(worksheet.getCell(row, col), {
        ...overrides,
        border: buildEdgeBorder({
          top: row == startRow,
          left: col == startCol,
          bottom: row == endRow,
          right: col == endCol,
        }),
      });
    }
  }
}

async function fetchAssetAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function triggerWorkbookDownload(buffer, filename) {
  const blob = new Blob(
    [buffer],
    { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
  );
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formatDateTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildInstitutionTitle(campusName) {
  const label = String(campusName || "CIENCIAS").trim().toUpperCase();
  return `INSTITUCION EDUCATIVA ${label}`;
}

function sanitizeFileName(value) {
  return String(value || "salon")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "salon";
}

function buildExportFileName(classroom, extension) {
  const grade = classroom?.grade || "grado";
  const section = classroom?.section || "seccion";
  const campus = classroom?.campusCode || "campus";
  return `registro-auxiliar-${sanitizeFileName(campus)}-${sanitizeFileName(`${grade}-${section}`)}.${extension}`;
}

function buildExportDocumentStyles() {
  return `
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
    }

    .export-root {
      padding: 12px;
      background: #ffffff;
    }

    .roster-sheet {
      width: 1122px;
      margin: 0 auto 18px auto;
      overflow: hidden;
      border: 1px solid #6b7280;
      background: #ffffff;
      box-sizing: border-box;
      page-break-after: always;
    }

    .roster-sheet:last-child {
      page-break-after: auto;
    }

    .sheet-header {
      display: grid;
      grid-template-columns: 96px 1fr 96px;
      align-items: center;
      border-bottom: 1px solid #6b7280;
      padding: 12px 20px;
    }

    .sheet-header img {
      width: 72px;
      height: 72px;
      object-fit: contain;
    }

    .sheet-title {
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .meta-row-a {
      display: grid;
      grid-template-columns: 180px 1fr 160px 80px 140px 80px;
      border-bottom: 1px solid #6b7280;
      font-size: 11px;
      font-style: italic;
      font-weight: 600;
    }

    .meta-row-b {
      display: grid;
      grid-template-columns: 180px 1fr 160px 100px 100px 100px;
      border-bottom: 1px solid #6b7280;
      font-size: 11px;
      font-style: italic;
      font-weight: 600;
    }

    .meta-cell {
      padding: 4px 8px;
      border-right: 1px solid #6b7280;
      box-sizing: border-box;
    }

    .meta-cell:last-child {
      border-right: none;
    }

    .meta-value {
      text-align: center;
      font-style: normal;
    }

    table.roster-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 9px;
      color: #000000;
    }

    table.roster-table th,
    table.roster-table td {
      border: 1px solid #6b7280;
      padding: 2px 4px;
      box-sizing: border-box;
    }

    .top-head {
      background: #d4d4d4;
      text-align: center;
      font-weight: 700;
      font-style: italic;
    }

    .sub-head {
      background: #f5f5f5;
      text-align: center;
      font-weight: 600;
      font-style: italic;
    }

    .order-col {
      width: 26px;
    }

    .final-col {
      width: 34px;
    }

    .name-head {
      width: 430px;
      font-size: 13px;
    }

    .vertical-main {
      position: relative;
      width: 26px;
      height: 104px;
      padding: 0;
      overflow: hidden;
    }

    .vertical-final {
      position: relative;
      width: 34px;
      height: 104px;
      padding: 0;
      overflow: hidden;
    }

    .vertical-subhead {
      position: relative;
      height: 104px;
      padding: 0;
      overflow: hidden;
    }

    .vertical-subhead.note-col {
      width: 26px;
    }

    .vertical-subhead.grade-col {
      width: 18px;
      background: #d4d4d4;
    }

    .rotated-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) rotate(-90deg);
      transform-origin: center;
      white-space: nowrap;
      line-height: 1;
    }

    .student-order {
      text-align: center;
      font-size: 10px;
      font-weight: 600;
    }

    .student-last,
    .student-name {
      font-size: 10px;
      text-transform: uppercase;
    }

    .sheet-footer {
      border-top: 1px solid #6b7280;
      padding: 20px 16px 24px 16px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
  `;
}

function buildExcelDocument(classroom, generatedAt) {
  const title = buildInstitutionTitle(classroom?.campusName || classroom?.campusCode);
  const students = Array.isArray(classroom?.students) ? classroom.students : [];
  const rows = students.length ? students : Array.from({ length: 18 }, () => ({ names: "", lastNames: "" }));
  const logoUrl = `${window.location.origin}${LOGO_SRC}`;

  const periodsHead = PERIOD_COLUMNS.map((period) => (
    `<th colspan="${SUBCOLUMNS.length}" class="top-head">${period.label}</th>`
  )).join("");

  const subHead = PERIOD_COLUMNS.flatMap((period) =>
    SUBCOLUMNS.map((label) => (
      `<th class="${label === "Calif." ? "rotated-subhead grade-col" : "rotated-subhead note-col"}">${label}</th>`
    ))
  ).join("");

  const summaryHead = SUMMARY_COLUMNS.map((label) => (
    `<th class="${label === "Calif." ? "rotated-subhead grade-col" : "rotated-subhead note-col"}">${label}</th>`
  )).join("");

  const bodyRows = rows.map((student, index) => {
    const emptyPeriodCells = PERIOD_COLUMNS.flatMap(() =>
      SUBCOLUMNS.map((label) => `<td class="${label === "Calif." ? "grade-col" : "note-col"}">&nbsp;</td>`)
    ).join("");
    const emptySummaryCells = SUMMARY_COLUMNS.map((label) => `<td class="${label === "Calif." ? "grade-col" : "note-col"}">&nbsp;</td>`).join("");

    return `
      <tr>
        <td class="student-order">${index + 1}</td>
        <td class="student-last">${student?.lastNames || ""}</td>
        <td class="student-name">${student?.names || ""}</td>
        ${emptyPeriodCells}
        ${emptySummaryCells}
        <td class="final-col">&nbsp;</td>
      </tr>
    `;
  }).join("");

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>${buildExportDocumentStyles()}</style>
      </head>
      <body>
        <div class="export-root">
          <section class="roster-sheet">
            <div class="sheet-header">
              <div><img src="${logoUrl}" alt="Colegio Ciencias" /></div>
              <div class="sheet-title">${title}</div>
              <div style="text-align:right;"><img src="${logoUrl}" alt="Colegio Ciencias" /></div>
            </div>

            <div class="meta-row-a">
              <div class="meta-cell">DOCENTE:</div>
              <div class="meta-cell meta-value"></div>
              <div class="meta-cell" style="text-align:right;">GRADO:</div>
              <div class="meta-cell meta-value">${classroom?.grade || "-"}</div>
              <div class="meta-cell" style="text-align:right;">SECCION:</div>
              <div class="meta-cell meta-value">${classroom?.section || "-"}</div>
            </div>

            <div class="meta-row-b">
              <div class="meta-cell">ASIGNATURA:</div>
              <div class="meta-cell meta-value"></div>
              <div class="meta-cell" style="text-align:right;">NIVEL:</div>
              <div class="meta-cell meta-value" style="grid-column: span 3; border-right:none;">${classroom?.level || "-"}</div>
            </div>

            <table class="roster-table">
              <thead>
                <tr>
                  <th rowspan="2" class="top-head order-col">Nro de Orden</th>
                  <th rowspan="2" colspan="2" class="top-head name-head">APELLIDOS Y NOMBRES</th>
                  ${periodsHead}
                  <th colspan="${SUMMARY_COLUMNS.length}" class="top-head">RESUMEN</th>
                  <th rowspan="2" class="top-head final-col">CALIF. FINAL DE AREA</th>
                </tr>
                <tr>
                  ${subHead}
                  ${summaryHead}
                </tr>
              </thead>
              <tbody>
                ${bodyRows}
              </tbody>
            </table>

            <div class="sheet-footer">**** LA SECCION "PUNTOS DE EVALUACION" QUEDA AL CRITERIO DEL DOCENTE. *****</div>
          </section>
        </div>
      </body>
    </html>
  `;
}

function buildPdfDocument(classroom) {
  const title = buildInstitutionTitle(classroom?.campusName || classroom?.campusCode);
  const students = Array.isArray(classroom?.students) ? classroom.students : [];
  const rows = students.length ? students : Array.from({ length: 18 }, () => ({ names: "", lastNames: "" }));
  const logoUrl = `${window.location.origin}${LOGO_SRC}`;

  const periodsHead = PERIOD_COLUMNS.map((period) => (
    `<th colspan="${SUBCOLUMNS.length}" class="top-head">${period.label}</th>`
  )).join("");

  const subHead = PERIOD_COLUMNS.flatMap((period) =>
    SUBCOLUMNS.map((label) => {
      const colClass = label === "Calif." ? "vertical-subhead grade-col" : "vertical-subhead note-col";
      return `<th class="sub-head ${colClass}"><span class="rotated-label">${label}</span></th>`;
    })
  ).join("");

  const summaryHead = SUMMARY_COLUMNS.map((label) => {
    const colClass = label === "Calif." ? "vertical-subhead grade-col" : "vertical-subhead note-col";
    return `<th class="sub-head ${colClass}"><span class="rotated-label">${label}</span></th>`;
  }).join("");

  const bodyRows = rows.map((student, index) => {
    const emptyPeriodCells = PERIOD_COLUMNS.flatMap(() =>
      SUBCOLUMNS.map((label) => `<td class="${label === "Calif." ? "grade-col" : "note-col"}">&nbsp;</td>`)
    ).join("");
    const emptySummaryCells = SUMMARY_COLUMNS.map((label) => `<td class="${label === "Calif." ? "grade-col" : "note-col"}">&nbsp;</td>`).join("");

    return `
      <tr>
        <td class="student-order">${index + 1}</td>
        <td class="student-last">${student?.lastNames || ""}</td>
        <td class="student-name">${student?.names || ""}</td>
        ${emptyPeriodCells}
        ${emptySummaryCells}
        <td>&nbsp;</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="export-root">
      <section class="roster-sheet">
        <div class="sheet-header">
          <div><img src="${logoUrl}" alt="Colegio Ciencias" /></div>
          <div class="sheet-title">${title}</div>
          <div style="text-align:right;"><img src="${logoUrl}" alt="Colegio Ciencias" /></div>
        </div>

        <div class="meta-row-a">
          <div class="meta-cell">DOCENTE:</div>
          <div class="meta-cell meta-value"></div>
          <div class="meta-cell" style="text-align:right;">GRADO:</div>
          <div class="meta-cell meta-value">${classroom?.grade || "-"}</div>
          <div class="meta-cell" style="text-align:right;">SECCION:</div>
          <div class="meta-cell meta-value">${classroom?.section || "-"}</div>
        </div>

        <div class="meta-row-b">
          <div class="meta-cell">ASIGNATURA:</div>
          <div class="meta-cell meta-value"></div>
          <div class="meta-cell" style="text-align:right;">NIVEL:</div>
          <div class="meta-cell meta-value" style="grid-column: span 3; border-right:none;">${classroom?.level || "-"}</div>
        </div>

        <table class="roster-table">
          <thead>
            <tr>
              <th rowspan="2" class="top-head vertical-main"><span class="rotated-label">Nro de Orden</span></th>
              <th rowspan="2" colspan="2" class="top-head name-head">APELLIDOS Y NOMBRES</th>
              ${periodsHead}
              <th colspan="${SUMMARY_COLUMNS.length}" class="top-head">RESUMEN</th>
              <th rowspan="2" class="top-head vertical-final"><span class="rotated-label">CALIF. FINAL DE AREA</span></th>
            </tr>
            <tr>
              ${subHead}
              ${summaryHead}
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>

        <div class="sheet-footer">**** LA SECCION "PUNTOS DE EVALUACION" QUEDA AL CRITERIO DEL DOCENTE. *****</div>
      </section>
    </div>
  `;
}

function waitForImages(node) {
  const images = Array.from(node.querySelectorAll("img"));
  if (!images.length) return Promise.resolve();

  return Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();

    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  }));
}

async function exportClassroomAsPdf(classroom) {
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-20000px";
  wrapper.style.top = "0";
  wrapper.style.width = "1146px";
  wrapper.style.background = "#ffffff";
  wrapper.style.zIndex = "-1";
  wrapper.innerHTML = `
    <style>${buildExportDocumentStyles()}</style>
    ${buildPdfDocument(classroom)}
  `;

  document.body.appendChild(wrapper);
  await waitForImages(wrapper);
  await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

  const node = wrapper.querySelector(".roster-sheet");
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  document.body.removeChild(wrapper);

  const imageData = canvas.toDataURL("image/png");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 6;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= usableHeight) {
    doc.addImage(imageData, "PNG", margin, margin, imgWidth, imgHeight);
  } else {
    const ratio = usableHeight / imgHeight;
    const fittedWidth = imgWidth * ratio;
    doc.addImage(imageData, "PNG", margin, margin, fittedWidth, usableHeight);
  }

  doc.save(buildExportFileName(classroom, "pdf"));
}

async function exportClassroomAsExcel(classroom) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Lista", {
    views: [{ showGridLines: false }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.3,
        bottom: 0.3,
        header: 0.1,
        footer: 0.1,
      },
    },
  });

  worksheet.properties.defaultRowHeight = 18;
  worksheet.columns = [
    { width: 4 },
    { width: 25 },
    { width: 22 },
    { width: 4.6 },
    { width: 4.6 },
    { width: 4.6 },
    { width: 4.9 },
    { width: 4.9 },
    { width: 3.3 },
    { width: 4.6 },
    { width: 4.6 },
    { width: 4.6 },
    { width: 4.9 },
    { width: 4.9 },
    { width: 3.3 },
    { width: 4.6 },
    { width: 4.6 },
    { width: 4.6 },
    { width: 4.9 },
    { width: 4.9 },
    { width: 3.3 },
    { width: 4.6 },
    { width: 4.6 },
    { width: 4.6 },
    { width: 4.9 },
    { width: 4.9 },
    { width: 3.3 },
    { width: 4.6 },
    { width: 4.6 },
    { width: 4.6 },
    { width: 4.9 },
    { width: 4.9 },
    { width: 3.3 },
    { width: 4 },
  ];

  const title = buildInstitutionTitle(classroom?.campusName || classroom?.campusCode);
  const students = Array.isArray(classroom?.students) ? classroom.students : [];
  const rows = getRosterRows(students);
  const level = classroom?.level || "-";
  const grade = classroom?.grade || "-";
  const section = classroom?.section || "-";

  worksheet.mergeCells(1, 1, 3, 3);
  worksheet.mergeCells(1, 4, 3, 31);
  worksheet.mergeCells(1, 32, 3, 34);
  worksheet.getCell(1, 4).value = title;
  styleExcelBox(worksheet, 1, 3, 1, 3);
  styleExcelBox(worksheet, 1, 3, 4, 31, {
    font: { name: "Arial", size: 18, bold: true, color: { argb: "FF000000" } },
    alignment: { horizontal: "center", vertical: "middle" },
  });
  styleExcelBox(worksheet, 1, 3, 32, 34);
  worksheet.getRow(1).height = 24;
  worksheet.getRow(2).height = 24;
  worksheet.getRow(3).height = 24;

  worksheet.mergeCells(4, 1, 4, 3);
  worksheet.mergeCells(4, 4, 4, 15);
  worksheet.mergeCells(4, 16, 4, 21);
  worksheet.mergeCells(4, 22, 4, 24);
  worksheet.mergeCells(4, 25, 4, 30);
  worksheet.mergeCells(4, 31, 4, 34);
  worksheet.getCell(4, 1).value = "DOCENTE:";
  worksheet.getCell(4, 16).value = "GRADO:";
  worksheet.getCell(4, 22).value = grade;
  worksheet.getCell(4, 25).value = "SECCION:";
  worksheet.getCell(4, 31).value = section;
  styleExcelBox(worksheet, 4, 4, 1, 3, {
    font: { name: "Arial", size: 11, bold: true, italic: true, color: { argb: "FF000000" } },
    alignment: { horizontal: "left", vertical: "middle" },
  });
  styleExcelBox(worksheet, 4, 4, 4, 15);
  styleExcelBox(worksheet, 4, 4, 16, 21, {
    font: { name: "Arial", size: 11, bold: true, italic: true, color: { argb: "FF000000" } },
    alignment: { horizontal: "right", vertical: "middle" },
  });
  styleExcelBox(worksheet, 4, 4, 22, 24, {
    font: { name: "Arial", size: 11, color: { argb: "FF000000" } },
    alignment: { horizontal: "center", vertical: "middle" },
  });
  styleExcelBox(worksheet, 4, 4, 25, 30, {
    font: { name: "Arial", size: 11, bold: true, italic: true, color: { argb: "FF000000" } },
    alignment: { horizontal: "right", vertical: "middle" },
  });
  styleExcelBox(worksheet, 4, 4, 31, 34, {
    font: { name: "Arial", size: 11, color: { argb: "FF000000" } },
    alignment: { horizontal: "center", vertical: "middle" },
  });

  worksheet.mergeCells(5, 1, 5, 3);
  worksheet.mergeCells(5, 4, 5, 15);
  worksheet.mergeCells(5, 16, 5, 21);
  worksheet.mergeCells(5, 22, 5, 34);
  worksheet.getCell(5, 1).value = "ASIGNATURA:";
  worksheet.getCell(5, 16).value = "NIVEL:";
  worksheet.getCell(5, 22).value = level;
  styleExcelBox(worksheet, 5, 5, 1, 3, {
    font: { name: "Arial", size: 11, bold: true, italic: true, color: { argb: "FF000000" } },
    alignment: { horizontal: "left", vertical: "middle" },
  });
  styleExcelBox(worksheet, 5, 5, 4, 15);
  styleExcelBox(worksheet, 5, 5, 16, 21, {
    font: { name: "Arial", size: 11, bold: true, italic: true, color: { argb: "FF000000" } },
    alignment: { horizontal: "right", vertical: "middle" },
  });
  styleExcelBox(worksheet, 5, 5, 22, 34, {
    font: { name: "Arial", size: 11, color: { argb: "FF000000" } },
    alignment: { horizontal: "center", vertical: "middle" },
  });

  worksheet.mergeCells(6, 1, 7, 1);
  worksheet.mergeCells(6, 2, 7, 3);
  worksheet.getCell(6, 1).value = "Nro de Orden";
  worksheet.getCell(6, 2).value = "APELLIDOS Y NOMBRES";
  setExcelCellStyle(worksheet.getCell(6, 1), {
    fill: EXCEL_HEADER_FILL,
    font: { name: "Arial", size: 11, bold: true, italic: true, color: { argb: "FF000000" } },
    alignment: { horizontal: "center", vertical: "middle", textRotation: 90, wrapText: true },
  });
  setExcelCellStyle(worksheet.getCell(6, 2), {
    fill: EXCEL_HEADER_FILL,
    font: { name: "Arial", size: 13, bold: true, italic: true, color: { argb: "FF000000" } },
    alignment: { horizontal: "center", vertical: "middle" },
  });

  let currentCol = 4;
  PERIOD_COLUMNS.forEach((period) => {
    const periodStart = currentCol;
    const periodEnd = currentCol + SUBCOLUMNS.length - 1;
    worksheet.mergeCells(6, periodStart, 6, periodEnd);
    worksheet.getCell(6, periodStart).value = period.label;
    setExcelCellStyle(worksheet.getCell(6, periodStart), {
      fill: EXCEL_HEADER_FILL,
      font: { name: "Arial", size: 12, bold: true, italic: true, color: { argb: "FF000000" } },
      alignment: { horizontal: "center", vertical: "middle" },
    });

    SUBCOLUMNS.forEach((label, index) => {
      const col = periodStart + index;
      worksheet.getCell(7, col).value = label;
      setExcelCellStyle(worksheet.getCell(7, col), {
        fill: label === "Calif." ? EXCEL_GRADE_FILL : EXCEL_SUBHEADER_FILL,
        font: { name: "Arial", size: 9, bold: true, italic: true, color: { argb: "FF000000" } },
        alignment: { horizontal: "center", vertical: "middle", textRotation: 90, wrapText: true },
      });
    });

    currentCol = periodEnd + 1;
  });

  const summaryStart = currentCol;
  const summaryEnd = currentCol + SUMMARY_COLUMNS.length - 1;
  worksheet.mergeCells(6, summaryStart, 6, summaryEnd);
  worksheet.getCell(6, summaryStart).value = "RESUMEN";
  setExcelCellStyle(worksheet.getCell(6, summaryStart), {
    fill: EXCEL_HEADER_FILL,
    font: { name: "Arial", size: 12, bold: true, italic: true, color: { argb: "FF000000" } },
    alignment: { horizontal: "center", vertical: "middle" },
  });

  SUMMARY_COLUMNS.forEach((label, index) => {
    const col = summaryStart + index;
    worksheet.getCell(7, col).value = label;
    setExcelCellStyle(worksheet.getCell(7, col), {
      fill: label === "Calif." ? EXCEL_GRADE_FILL : EXCEL_SUBHEADER_FILL,
      font: { name: "Arial", size: 9, bold: true, italic: true, color: { argb: "FF000000" } },
      alignment: { horizontal: "center", vertical: "middle", textRotation: 90, wrapText: true },
    });
  });

  worksheet.mergeCells(6, 34, 7, 34);
  worksheet.getCell(6, 34).value = "CALIF. FINAL DE AREA";
  setExcelCellStyle(worksheet.getCell(6, 34), {
    fill: EXCEL_HEADER_FILL,
    font: { name: "Arial", size: 10, bold: true, italic: true, color: { argb: "FF000000" } },
    alignment: { horizontal: "center", vertical: "middle", textRotation: 90, wrapText: true },
  });

  worksheet.getRow(6).height = 22;
  worksheet.getRow(7).height = 92;

  const bodyStartRow = 8;
  const gradeColumns = new Set([9, 15, 21, 27, 33]);
  rows.forEach((student, index) => {
    const rowNumber = bodyStartRow + index;
    worksheet.getCell(rowNumber, 1).value = index + 1;
    worksheet.getCell(rowNumber, 2).value = String(student?.lastNames || "").toUpperCase();
    worksheet.getCell(rowNumber, 3).value = String(student?.names || "").toUpperCase();

    for (let col = 1; col <= EXCEL_TOTAL_COLUMNS; col += 1) {
      setExcelCellStyle(worksheet.getCell(rowNumber, col), {
        fill: gradeColumns.has(col) ? EXCEL_GRADE_FILL : undefined,
        font: { name: "Arial", size: 10, color: { argb: "FF000000" } },
        alignment: col === 1
          ? { horizontal: "center", vertical: "middle" }
          : col === 2 || col === 3
            ? { horizontal: "left", vertical: "middle" }
            : { horizontal: "center", vertical: "middle" },
      });
    }

    worksheet.getRow(rowNumber).height = 18;
  });

  const footerRow = bodyStartRow + rows.length + 2;
  worksheet.mergeCells(footerRow, 1, footerRow, 34);
  worksheet.getCell(footerRow, 1).value = '**** LA SECCION "PUNTOS DE EVALUACION" QUEDA AL CRITERIO DEL DOCENTE. *****';
  setExcelCellStyle(worksheet.getCell(footerRow, 1), {
    font: { name: "Arial", size: 11, bold: true, color: { argb: "FF000000" } },
    alignment: { horizontal: "center", vertical: "middle" },
  });
  worksheet.getRow(footerRow).height = 24;

  const logoBase64 = await fetchAssetAsBase64(LOGO_SRC);
  const imageId = workbook.addImage({ base64: logoBase64, extension: "png" });
  worksheet.addImage(imageId, { tl: { col: 0.35, row: 0.2 }, ext: { width: 78, height: 78 } });
  worksheet.addImage(imageId, { tl: { col: 31.2, row: 0.2 }, ext: { width: 78, height: 78 } });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerWorkbookDownload(buffer, buildExportFileName(classroom, "xlsx"));
}

export default function ClassroomRosterPrintPreviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const printKey = params.get("printKey") || "";

  const payload = useMemo(() => resolveClassroomRosterPrintPayload(printKey), [printKey]);
  const classrooms = Array.isArray(payload?.items) ? payload.items : [];

  const handleDownloadPdf = async () => {
    for (const classroom of classrooms) {
      await exportClassroomAsPdf(classroom);
    }
  };

  const handleDownloadExcel = async () => {
    for (const classroom of classrooms) {
      await exportClassroomAsExcel(classroom);
    }
  };

  return (
    <>
      <style>
        {`
          @page {
            size: A4 landscape;
            margin: 8mm;
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

            .roster-sheet {
              box-shadow: none !important;
              margin: 0 auto !important;
              page-break-after: always;
            }

            .roster-sheet:last-of-type {
              page-break-after: auto;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-stone-200 py-6 print:bg-white print:py-0">
        <div className="print-controls mx-auto mb-3 flex w-[297mm] max-w-full flex-wrap justify-end gap-2 px-2">
          <Button onClick={handleDownloadExcel}>Descargar Excel</Button>
          <SecondaryButton onClick={() => window.print()}>Imprimir</SecondaryButton>
          <SecondaryButton onClick={() => window.close()}>Cerrar</SecondaryButton>
        </div>

        {!classrooms.length ? (
          <div className="mx-auto w-[297mm] max-w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">Vista de impresion de salones</h1>
            <p className="mt-2 text-base text-gray-600">No hay listas de alumnos para imprimir.</p>
            <div className="mt-4">
              <SecondaryButton onClick={() => navigate(ROUTES.dashboardClassrooms)}>Volver a salones</SecondaryButton>
            </div>
          </div>
        ) : (
          <div className="space-y-5 print:space-y-0">
            {classrooms.map((classroom) => {
              const students = Array.isArray(classroom?.students) ? classroom.students : [];
              const sheetKey = classroom.classroomId || classroom.label;

              return (
                <section
                  key={sheetKey}
                  className="roster-sheet mx-auto w-[297mm] max-w-full overflow-hidden border border-gray-500 bg-white shadow-sm print:w-full print:max-w-none"
                >
                  <div className="grid grid-cols-[96px_1fr_96px] items-center border-b border-gray-500 px-5 py-3">
                    <div className="flex justify-start">
                      <img src={LOGO_SRC} alt="Colegio Ciencias" className="h-[72px] w-[72px] object-contain" />
                    </div>
                    <div className="text-center text-[18px] font-bold tracking-[0.04em] text-black">
                      {buildInstitutionTitle(classroom.campusName || classroom.campusCode)}
                    </div>
                    <div className="flex justify-end">
                      <img src={LOGO_SRC} alt="Colegio Ciencias" className="h-[72px] w-[72px] object-contain" />
                    </div>
                  </div>

                  <div className="grid grid-cols-[180px_1fr_160px_80px_140px_80px] border-b border-gray-500 text-[11px] font-semibold italic text-black">
                    <div className="border-r border-gray-500 px-2 py-1">DOCENTE:</div>
                    <div className="border-r border-gray-500 px-2 py-1 not-italic"></div>
                    <div className="border-r border-gray-500 px-2 py-1 text-right">GRADO:</div>
                    <div className="border-r border-gray-500 px-2 py-1 text-center not-italic">{classroom.grade || "-"}</div>
                    <div className="border-r border-gray-500 px-2 py-1 text-right">SECCION:</div>
                    <div className="px-2 py-1 text-center not-italic">{classroom.section || "-"}</div>
                  </div>

                  <div className="grid grid-cols-[180px_1fr_160px_100px_100px_100px] border-b border-gray-500 text-[11px] font-semibold italic text-black">
                    <div className="border-r border-gray-500 px-2 py-1">ASIGNATURA:</div>
                    <div className="border-r border-gray-500 px-2 py-1 not-italic"></div>
                    <div className="border-r border-gray-500 px-2 py-1 text-right">NIVEL:</div>
                    <div className="px-2 py-1 col-span-3 text-center not-italic">{classroom.level || "-"}</div>
                  </div>

                  <table className="w-full border-collapse text-[9px] text-black">
                    <thead>
                      <tr className="bg-neutral-300 text-center font-bold italic">
                        <th rowSpan={2} className="w-[24px] border border-gray-500 px-1 py-1 [writing-mode:vertical-rl] [text-orientation:mixed] rotate-180">Nro de Orden</th>
                        <th rowSpan={2} colSpan={2} className="w-[430px] border border-gray-500 px-2 py-1 text-[13px]">APELLIDOS Y NOMBRES</th>
                        {PERIOD_COLUMNS.map((period) => (
                          <th key={period.key} colSpan={SUBCOLUMNS.length} className="border border-gray-500 px-1 py-1 text-[12px]">{period.label}</th>
                        ))}
                        <th colSpan={SUMMARY_COLUMNS.length} className="border border-gray-500 px-1 py-1 text-[12px]">RESUMEN</th>
                        <th rowSpan={2} className="w-[30px] border border-gray-500 px-1 py-1 [writing-mode:vertical-rl] [text-orientation:mixed] rotate-180">CALIF. FINAL DE AREA</th>
                      </tr>
                      <tr className="bg-neutral-100 text-center font-semibold italic">
                        {PERIOD_COLUMNS.flatMap((period) =>
                          SUBCOLUMNS.map((label) => (
                            <th
                              key={`${period.key}-${label}`}
                              className={[
                                label === "Calif." ? "w-[18px] bg-neutral-300" : "w-[26px]",
                                "border border-gray-500 px-[2px] py-[3px] align-bottom [writing-mode:vertical-rl] [text-orientation:mixed] rotate-180",
                              ].join(" ")}
                            >
                              {label}
                            </th>
                          ))
                        )}
                        {SUMMARY_COLUMNS.map((label) => (
                          <th
                            key={`summary-${label}`}
                            className={[
                              label === "Calif." ? "w-[18px] bg-neutral-300" : "w-[26px]",
                              "border border-gray-500 px-[2px] py-[3px] align-bottom [writing-mode:vertical-rl] [text-orientation:mixed] rotate-180",
                            ].join(" ")}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(students.length ? students : Array.from({ length: 18 }, () => ({ names: "", lastNames: "" }))).map((student, index) => (
                        <tr key={student.studentId || `${classroom.classroomId}-${index}`}>
                          <td className="border border-gray-500 px-1 py-[2px] text-center text-[10px] font-semibold">{index + 1}</td>
                          <td className="border border-gray-500 px-1 py-[2px] text-[10px] uppercase">{student.lastNames || ""}</td>
                          <td className="border border-gray-500 px-1 py-[2px] text-[10px] uppercase">{student.names || ""}</td>
                          {PERIOD_COLUMNS.flatMap((period) =>
                            SUBCOLUMNS.map((label, cellIndex) => (
                              <td
                                key={`period-cell-${index}-${period.key}-${cellIndex}`}
                                className={[
                                  label === "Calif." ? "bg-neutral-300" : "",
                                  "border border-gray-500 px-1 py-[2px]",
                                ].join(" ")}
                              >
                                &nbsp;
                              </td>
                            ))
                          )}
                          {SUMMARY_COLUMNS.map((label, cellIndex) => (
                            <td
                              key={`summary-cell-${index}-${cellIndex}`}
                              className={[
                                label === "Calif." ? "bg-neutral-300" : "",
                                "border border-gray-500 px-1 py-[2px]",
                              ].join(" ")}
                            >
                              &nbsp;
                            </td>
                          ))}
                          <td className="border border-gray-500 px-1 py-[2px]">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="border-t border-gray-500 px-4 py-6 text-center text-[11px] font-bold tracking-[0.02em] text-black">
                    **** LA SECCION "PUNTOS DE EVALUACION" QUEDA AL CRITERIO DEL DOCENTE. *****
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
