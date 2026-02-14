const COMBINING_DIACRITICS_REGEX = /[\u0300-\u036f]/g;

export function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim();
}

