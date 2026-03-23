import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

function logRequest(endpoint, method, params) {
  console.log("[StudentsPage][API][REQUEST]", {
    endpoint,
    method,
    params,
  });
}

function logResponse(endpoint, status, dataSummary) {
  console.log("[StudentsPage][API][RESPONSE]", {
    endpoint,
    status,
    dataSummary,
  });
}

function getFirstStudentSample(items) {
  if (!Array.isArray(items) || !items.length) return null;
  return items[0];
}

export async function searchStudents({ q, limit = 10, cursor = null }) {
  const params = { limit };
  if (q?.trim()) params.q = q.trim();
  if (cursor) params.cursor = cursor;

  logRequest(API_ROUTES.students, "GET", params);

  const res = await axiosInstance.get(API_ROUTES.students, { params });
  const items = Array.isArray(res.data?.items) ? res.data.items : [];

  logResponse(API_ROUTES.students, res.status, {
    count: items.length,
    nextCursor: res.data?.nextCursor || null,
    firstStudent: getFirstStudentSample(items),
  });

  return res.data;
}

export async function listByCampus({ campus, q = "", limit = 10, cursor = null }) {
  const endpoint = API_ROUTES.studentsByCampus(campus);
  const params = { limit };
  if (q?.trim()) params.q = q.trim();
  if (cursor) params.cursor = cursor;

  logRequest(endpoint, "GET", params);

  const res = await axiosInstance.get(endpoint, { params });
  const items = Array.isArray(res.data?.items) ? res.data.items : [];

  logResponse(endpoint, res.status, {
    count: items.length,
    nextCursor: res.data?.nextCursor || null,
    firstStudent: getFirstStudentSample(items),
  });

  return res.data;
}

export async function getStudentSummary(studentId) {
  const endpoint = API_ROUTES.studentSummary(studentId);

  logRequest(endpoint, "GET", {});

  const res = await axiosInstance.get(endpoint);

  logResponse(endpoint, res.status, res.data);

  return res.data;
}

export async function createStudentIntake(payload) {
  const endpoint = API_ROUTES.studentIntake;

  logRequest(endpoint, "POST", payload);
  const res = await axiosInstance.post(endpoint, payload);
  logResponse(endpoint, res.status, {
    studentId: res.data?.studentId || res.data?.student?.id || null,
    familyId: res.data?.familyId || res.data?.family?.id || null,
  });
  return res.data;
}

export async function getStudentDetail(studentId) {
  return getStudentSummary(studentId);
}

export async function getClassroomOptions({ level, grade, campus, includeCapacity = true }) {
  const endpoint = API_ROUTES.classroomOptions;
  const params = { level, includeCapacity };
  if (grade) params.grade = grade;
  if (campus) params.campus = campus;

  logRequest(endpoint, "GET", params);
  const res = await axiosInstance.get(endpoint, { params });
  logResponse(endpoint, res.status, { count: Array.isArray(res.data?.items) ? res.data.items.length : 0 });

  return res.data;
}

export async function getClassroomCapacity(classroomId) {
  const endpoint = API_ROUTES.enrollmentClassroomCapacity(classroomId);

  logRequest(endpoint, "GET", {});
  const res = await axiosInstance.get(endpoint);
  logResponse(endpoint, res.status, res.data);

  return res.data;
}

export async function createEnrollment(payload) {
  logRequest(API_ROUTES.enrollments, "POST", payload);
  const res = await axiosInstance.post(API_ROUTES.enrollments, payload);
  logResponse(API_ROUTES.enrollments, res.status, res.data);
  return res.data;
}

export async function updateEnrollmentStatus(enrollmentId, payload) {
  const endpoint = API_ROUTES.enrollmentStatus(enrollmentId);
  logRequest(endpoint, "PATCH", payload);
  const res = await axiosInstance.patch(endpoint, payload);
  logResponse(endpoint, res.status, res.data);
  return res.data;
}

export async function changeStudentClassroom(studentId, payload) {
  const endpoint = API_ROUTES.studentClassroom(studentId);
  logRequest(endpoint, "PATCH", payload);
  const res = await axiosInstance.patch(endpoint, payload);
  logResponse(endpoint, res.status, res.data);
  return res.data;
}

export async function createStudentCharge(payload) {
  logRequest(API_ROUTES.charges, "POST", payload);
  const res = await axiosInstance.post(API_ROUTES.charges, payload);
  logResponse(API_ROUTES.charges, res.status, res.data);
  return res.data;
}

export async function updateStudentCharge(chargeId, payload) {
  const endpoint = API_ROUTES.chargeDetail(chargeId);
  logRequest(endpoint, "PATCH", payload);
  const res = await axiosInstance.patch(endpoint, payload);
  logResponse(endpoint, res.status, res.data);
  return res.data;
}

export async function deleteStudentCharge(chargeId) {
  const endpoint = API_ROUTES.chargeDetail(chargeId);
  logRequest(endpoint, "DELETE", {});
  const res = await axiosInstance.delete(endpoint);
  logResponse(endpoint, res.status, res.data);
  return res.data;
}

export async function updateStudentIdentity(studentId, payload) {
  const endpoint = API_ROUTES.studentIdentity(studentId);
  logRequest(endpoint, "PATCH", payload);
  const res = await axiosInstance.patch(endpoint, payload);
  logResponse(endpoint, res.status, res.data);
  return res.data;
}

export async function updateStudentInternalNotes(studentId, payload) {
  const endpoint = API_ROUTES.studentInternalNotes(studentId);
  logRequest(endpoint, "PATCH", payload);
  const res = await axiosInstance.patch(endpoint, payload);
  logResponse(endpoint, res.status, res.data);
  return res.data;
}
