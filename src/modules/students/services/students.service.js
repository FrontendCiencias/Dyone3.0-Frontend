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

export async function listAllByCampus({ campus, limit = 1000 }) {
  const endpoint = API_ROUTES.studentsByCampus(campus);
  let cursor = null;
  let page = 0;
  const allItems = [];

  do {
    const params = { limit };
    if (cursor) params.cursor = cursor;

    logRequest(endpoint, "GET", params);

    const res = await axiosInstance.get(endpoint, { params });
    const items = Array.isArray(res.data?.items) ? res.data.items : [];

    allItems.push(...items);
    cursor = res.data?.nextCursor || null;
    page += 1;

    logResponse(endpoint, res.status, {
      page,
      count: items.length,
      nextCursor: cursor,
      firstStudent: getFirstStudentSample(items),
    });

    if (page > 100) break;
  } while (cursor);

  return {
    items: allItems,
    nextCursor: null,
  };
}

export async function getStudentSummary(studentId) {
  const endpoint = API_ROUTES.studentSummary(studentId);

  logRequest(endpoint, "GET", {});

  const res = await axiosInstance.get(endpoint);

  logResponse(endpoint, res.status, res.data);

  return res.data;
}

export async function createStudentWithPerson(payload) {
  const endpoint = API_ROUTES.createStudentWithPerson;

  logRequest(endpoint, "POST", payload);

  try {
    const res = await axiosInstance.post(endpoint, payload);
    logResponse(endpoint, res.status, { id: res.data?.id || res.data?.student?.id || null });
    return res.data;
  } catch (error) {
    if (error?.response?.status !== 404) throw error;

    logRequest(API_ROUTES.students, "POST", payload);
    const fallbackRes = await axiosInstance.post(API_ROUTES.students, payload);
    logResponse(API_ROUTES.students, fallbackRes.status, {
      id: fallbackRes.data?.id || fallbackRes.data?.student?.id || null,
    });

    return fallbackRes.data;
  }
}

export async function getStudentDetail(studentId) {
  // TODO: cuando backend exponga endpoint de detalle completo, reemplazar por ese endpoint.
  return getStudentSummary(studentId);
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

export async function confirmEnrollment(enrollmentId, payload = {}) {
  const endpoint = API_ROUTES.enrollmentConfirm(enrollmentId);
  logRequest(endpoint, "POST", payload);
  const res = await axiosInstance.post(endpoint, payload);
  logResponse(endpoint, res.status, res.data);
  return res.data;
}

export async function updateStudentCycleStatus(studentId, payload) {
  const endpoint = API_ROUTES.studentCycleStatus(studentId);
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
