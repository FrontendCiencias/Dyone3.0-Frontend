const ENROLLMENT_STATUS_LABELS = {
  ENROLLED: "Matriculado",
  TRANSFERRED: "Transferido",
  ABSENT: "Ausente", // no confirmó / no asistió a confirmar (según tu negocio)
};

export function formatEnrollmentStatus(status) {
  if (!status) return "—";
  const key = String(status).trim().toUpperCase();
  return ENROLLMENT_STATUS_LABELS[key] ?? status; // fallback: muestra lo que vino
}