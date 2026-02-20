export function getFamilyIdLabel(family) {
  return family?.id || family?._id || family?.familyId || "Sin ID";
}

export function getTutorId(tutor) {
  return tutor?.id || tutor?._id || tutor?.tutorId || tutor?.tutor?._id || null;
}

export function getTutorFullName(tutor) {
  const person = tutor?.tutorPerson || tutor?.person || tutor;
  return [person?.lastNames, person?.names].filter(Boolean).join(", ") || person?.fullName || "Sin nombre";
}

export function getTutors(familyDetail) {
  const primary = familyDetail?.primaryTutor || familyDetail?.primaryTutor_send;
  const others = familyDetail?.otherTutors || familyDetail?.otherTutors_send || familyDetail?.tutors || [];
  return [primary, ...(Array.isArray(others) ? others : [])]
    .filter(Boolean)
    .filter((tutor, idx, arr) => idx === arr.findIndex((item) => String(getTutorId(item)) === String(getTutorId(tutor))));
}

export function getStudents(familyDetail) {
  const family = familyDetail?.family || familyDetail || {};
  return Array.isArray(family?.students) ? family.students : Array.isArray(familyDetail?.students) ? familyDetail.students : [];
}

export function getPrimaryTutor(familyDetail) {
  const primary = familyDetail?.primaryTutor || familyDetail?.primaryTutor_send;
  if (primary) return primary;

  const tutors = getTutors(familyDetail);
  return tutors.find((item) => Boolean(item?.isPrimary)) || tutors[0] || null;
}

export function getPrimaryTutorDisplayName(familyDetail) {
  const tutor = getPrimaryTutor(familyDetail);
  if (tutor) return getTutorFullName(tutor);

  const tutors = getTutors(familyDetail);
  if (tutors.length > 0) return getTutorFullName(tutors[0]);

  return "Sin tutor";
}

export function getPrimaryTutorName(family) {
  const tutor = getPrimaryTutor(family);
  if (!tutor) return "Sin tutor principal";
  return getTutorFullName(tutor);
}
