export const CLASSROOM_STATUS_THRESHOLDS = {
  IN_PROCESS_MAX_AVAILABLE: 5,
};

export function getClassroomCapacityStatus(availableSeats) {
  const available = Number(availableSeats);
  if (Number.isNaN(available)) return null;

  if (available <= 0) return { color: "🔴", label: "Lleno" };
  if (available <= CLASSROOM_STATUS_THRESHOLDS.IN_PROCESS_MAX_AVAILABLE) {
    return { color: "🟡", label: "En proceso" };
  }

  return { color: "🟢", label: "Disponible" };
}

