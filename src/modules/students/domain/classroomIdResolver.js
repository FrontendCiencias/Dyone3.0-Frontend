function normalizeClassroomLabel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-");
}

export function buildClassroomLookup(classrooms = []) {
  const map = new Map();

  classrooms.forEach((classroom) => {
    const classroomId = classroom?.id;
    if (!classroomId) return;

    const aliases = [
      classroom?.id,
      classroom?.displayName,
      `${classroom?.grade || ""} - ${classroom?.section || ""}`.trim(),
      `${classroom?.grade || ""}-${classroom?.section || ""}`.trim(),
    ].filter(Boolean);

    aliases.forEach((alias) => map.set(normalizeClassroomLabel(alias), classroomId));
  });

  return map;
}

export function resolveClassroomId({ value, lookup, fallbackStudent }) {
  const normalized = normalizeClassroomLabel(value);
  if (!normalized) return null;

  const fromLookup = lookup?.get?.(normalized);
  if (fromLookup) return fromLookup;

  return (
    fallbackStudent?.classroomId ||
    fallbackStudent?.classroom?.id ||
    fallbackStudent?.enrollment?.classroomId ||
    fallbackStudent?.enrollmentStatus?.classroomId ||
    null
  );
}

export { normalizeClassroomLabel };
