export function getFamilyIdLabel(family) {
  return family?.id || family?._id || family?.familyId || "Sin ID";
}

export function getTutors(familyDetail) {
  const family = familyDetail?.family || familyDetail || {};
  const primary = family?.primaryTutor || family?.primaryTutor_send;
  const others = family?.otherTutors || family?.otherTutors_send || family?.tutors || [];
  return [primary, ...(Array.isArray(others) ? others : [])].filter(Boolean);
}

export function getStudents(familyDetail) {
  const family = familyDetail?.family || familyDetail || {};
  return Array.isArray(family?.students) ? family.students : Array.isArray(familyDetail?.students) ? familyDetail.students : [];
}

export function getPrimaryTutorName(family) {
  const tutor = family?.primaryTutor || family?.primaryTutor_send || family?.tutors?.find?.((item) => item?.isPrimary);
  if (!tutor) return "Sin tutor principal";
  return [tutor?.lastNames, tutor?.names].filter(Boolean).join(", ") || tutor?.fullName || "Sin nombre";
}
