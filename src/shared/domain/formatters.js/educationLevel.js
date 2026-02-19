const EDUCATION_LEVEL_LABELS = {
  INITIAL: "Inicial",
  PRIMARY: "Primaria",
  SECONDARY: "Secundaria",
};

export function formatEducationLevel(level) {
  if (!level) return "—";
  const key = String(level).trim().toUpperCase();
  return EDUCATION_LEVEL_LABELS[key] ?? level;
}