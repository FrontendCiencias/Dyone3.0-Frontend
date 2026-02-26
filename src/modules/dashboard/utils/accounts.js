export const ROLE_PRIORITY = [
  "SECRETARY",
  "DIRECTOR",
  "PROMOTER",
  "AUXILIAR",
  "TEACHER",
  "STUDENT",
  "SECRETARY_VIEWER",
  "ADMIN",
];

export const CAMPUS_ORDER = ["CIENCIAS", "CIENCIAS_APLICADAS", "CIMAS"];

const PURE_ROLES = [
  "ADMIN",
  "PROMOTER",
  "SECRETARY",
  "SECRETARY_VIEWER",
  "AUXILIAR",
  "DIRECTOR",
  "TEACHER",
  "STUDENT",
];

function uniq(list = []) {
  return [...new Set(list)];
}

export function normalizeRoles(inputRoles = []) {
  const roles = uniq(
    (Array.isArray(inputRoles) ? inputRoles : [])
      .map((r) => String(r || "").toUpperCase().trim())
      .filter(Boolean),
  );

  return roles
    .map((role) => {
      if (PURE_ROLES.includes(role)) return role;
      if (role.startsWith("SECRETARY")) return "SECRETARY";
      if (role.startsWith("DIRECTOR")) return "DIRECTOR";
      if (role.startsWith("PROMOTER")) return "PROMOTER";
      if (role.startsWith("ADMIN")) return "ADMIN";
      return role;
    })
    .filter((r) => PURE_ROLES.includes(r));
}

export function normalizeCampusScopeForRoles({ roles = [], campusScope = [] }) {
  const roleList = normalizeRoles(roles);

  if (roleList.includes("ADMIN")) return ["ALL"];
  if (roleList.includes("PROMOTER")) return ["ALL"];

  const safeCampuses = uniq(
    (Array.isArray(campusScope) ? campusScope : [])
      .map((c) => String(c || "").toUpperCase().trim())
      .filter((c) => CAMPUS_ORDER.includes(c)),
  );

  return safeCampuses.length ? safeCampuses : ["CIENCIAS"];
}

export function rolePriorityIndex(role) {
  const idx = ROLE_PRIORITY.indexOf(String(role || "").toUpperCase());
  return idx === -1 ? 999 : idx;
}

export function pickDefaultRole(roles = []) {
  const roleList = normalizeRoles(roles);

  if (roleList.includes("ADMIN")) return "ADMIN";

  const sorted = [...roleList].sort((a, b) => rolePriorityIndex(a) - rolePriorityIndex(b));
  return sorted[0] || null;
}

export function buildAccountOptions({ roles = [], campusScope = [] }) {
  const roleList = normalizeRoles(roles);
  const options = [];

  if (roleList.includes("ADMIN")) {
    options.push({ role: "ADMIN", campus: "ALL" });
  }

  if (roleList.includes("PROMOTER")) {
    options.push({ role: "PROMOTER", campus: "ALL" });
  }

  const scopedCampuses = uniq(
    (Array.isArray(campusScope) ? campusScope : [])
      .map((c) => String(c || "").toUpperCase().trim())
      .filter((c) => CAMPUS_ORDER.includes(c)),
  );

  const campusSorted = CAMPUS_ORDER.filter((c) => scopedCampuses.includes(c));

  const campusRoles = roleList.filter((r) => r !== "ADMIN" && r !== "PROMOTER");

  for (const role of campusRoles) {
    for (const campus of campusSorted) {
      options.push({ role, campus });
    }
  }

  return options.sort((a, b) => {
    const byRole = rolePriorityIndex(a.role) - rolePriorityIndex(b.role);
    if (byRole !== 0) return byRole;

    const aCampusRank = a.campus === "ALL" ? -1 : CAMPUS_ORDER.indexOf(a.campus);
    const bCampusRank = b.campus === "ALL" ? -1 : CAMPUS_ORDER.indexOf(b.campus);
    return aCampusRank - bCampusRank;
  });
}

export function isValidAccountSelection(selection, options = []) {
  const role = String(selection?.role || "").toUpperCase();
  const campus = String(selection?.campus || "").toUpperCase();
  return options.some((opt) => opt.role === role && opt.campus === campus);
}

export function pickDefaultActiveAccount({ roles = [], campusScope = [], preferred } = {}) {
  const options = buildAccountOptions({ roles, campusScope });
  if (!options.length) return { role: null, campus: null };

  if (isValidAccountSelection(preferred, options)) {
    return {
      role: String(preferred.role).toUpperCase(),
      campus: String(preferred.campus).toUpperCase(),
    };
  }

  const roleList = normalizeRoles(roles);

  if (roleList.includes("ADMIN")) return { role: "ADMIN", campus: "ALL" };

  const defaultRole = pickDefaultRole(roleList);
  const firstCampus = CAMPUS_ORDER.find((c) => normalizeCampusScopeForRoles({ roles: roleList, campusScope }).includes(c)) || "CIENCIAS";

  const exact = options.find((opt) => opt.role === defaultRole && opt.campus === firstCampus);
  if (exact) return exact;

  const byRole = options.find((opt) => opt.role === defaultRole);
  return byRole || options[0];
}

function roleLabel(role) {
  switch (String(role || "").toUpperCase()) {
    case "ADMIN":
      return "Admin";
    case "PROMOTER":
      return "Promotor";
    case "DIRECTOR":
      return "Dirección";
    case "AUXILIAR":
      return "Auxiliar";
    case "SECRETARY_VIEWER":
      return "Secretaría (Solo lectura)";
    case "SECRETARY":
      return "Secretaría";
    case "TEACHER":
      return "Docente";
    case "STUDENT":
      return "Estudiante";
    default:
      return "Usuario";
  }
}

function campusLabel(campus) {
  switch (String(campus || "").toUpperCase()) {
    case "ALL":
      return "Todos";
    case "CIENCIAS":
      return "Ciencias";
    case "CIENCIAS_APLICADAS":
      return "Aplicadas";
    case "CIMAS":
      return "Cimas";
    default:
      return campus || "Campus";
  }
}

export function formatAccountLabel({ role, campus }) {
  return `${roleLabel(role)} - ${campusLabel(campus)}`;
}
