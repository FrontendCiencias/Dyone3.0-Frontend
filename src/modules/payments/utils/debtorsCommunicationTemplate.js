export const DEFAULT_DEBTORS_COMMUNICATION_TEMPLATE = {
  title: "Recordatorio de pago",
  subject: "",
  body:
    "Estimados padres de familia:\n\nPor medio del presente, les recordamos que el alumno {{alumno_nombre}} mantiene un saldo vencido de {{deuda_vencida}}.\n\nConceptos vencidos:\n{{conceptos_deuda}}\n\nAgradeceremos regularizar el pago a la brevedad en secretaria.\n\nAtentamente,\nLa Direccion",
};

function normalizeMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function formatDateEs(value) {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatLevelLabel(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "INITIAL") return "Inicial";
  if (normalized === "PRIMARY") return "Primaria";
  if (normalized === "SECONDARY") return "Secundaria";
  return value || "-";
}

function buildConceptsSummary(item) {
  const entries = Array.isArray(item?.conceptsSummary) ? item.conceptsSummary : [];
  const overdueEntries = entries.filter((entry) => Number(entry?.overdueAmount || 0) > 0);
  if (!overdueEntries.length) return "-";
  return overdueEntries
    .map((entry) => `${entry.label}: ${normalizeMoney(entry.overdueAmount)}`)
    .join("\n");
}

export function buildCommunicationVariables(item, generatedAt = null) {
  const pending = Number(item?.pendingNonOverdue || 0);
  const overdue = Number(item?.totalOverdue || 0);
  const total = Number(item?.totalPending || 0);

  return {
    "{{alumno_nombre}}": item?.fullName || "-",
    "{{alumno_nombre_1}}": item?.names?.split(/\s+/).filter(Boolean)?.[0] || "-",
    "{{alumno_nombre_2}}": item?.names?.split(/\s+/).filter(Boolean)?.slice(1).join(" ") || "",
    "{{alumno_apellido_paterno}}": item?.lastNames?.split(/\s+/).filter(Boolean)?.[0] || "-",
    "{{alumno_apellido_materno}}": item?.lastNames?.split(/\s+/).filter(Boolean)?.slice(1).join(" ") || "",
    "{{alumno_codigo}}": item?.code || "-",
    "{{alumno_dni}}": item?.dni || "-",
    "{{alumno_salon}}": item?.classroomLabel || "-",
    "{{alumno_nivel}}": formatLevelLabel(item?.level),
    "{{alumno_grado}}": item?.grade || "-",
    "{{alumno_seccion}}": item?.section || "-",
    "{{deuda_pendiente}}": normalizeMoney(pending),
    "{{deuda_vencida}}": normalizeMoney(overdue),
    "{{deuda_total}}": normalizeMoney(total),
    "{{conceptos_deuda}}": buildConceptsSummary(item),
    "{{fecha_actual}}": formatDateEs(generatedAt),
  };
}

export function renderCommunicationText(templateText, item, generatedAt = null) {
  const source = String(templateText || "");
  const variables = buildCommunicationVariables(item, generatedAt);
  return Object.entries(variables).reduce(
    (current, [placeholder, value]) => current.split(placeholder).join(value),
    source,
  );
}
