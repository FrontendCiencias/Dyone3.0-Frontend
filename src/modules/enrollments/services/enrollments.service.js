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

export async function finalizeEnrollment(payload) {
  logRequest(API_ROUTES.enrollmentFinalize, "POST", payload);
  try {
    const res = await axiosInstance.post(API_ROUTES.enrollmentFinalize, payload);
    logResponse(API_ROUTES.enrollmentFinalize, res.status, res.data);
    return res.data;
  } catch (error) {
    console.error("[Enrollments][Finalize][ERROR]", {
      endpoint: API_ROUTES.enrollmentFinalize,
      payload,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    throw error;
  }
}

export async function searchTutorsForEnrollments({ q, limit = 8 }) {
  const normalizedQuery = String(q || "").trim();
  if (normalizedQuery.length < 2) {
    return { items: [], total: 0 };
  }

  const params = { q: normalizedQuery, limit };
  logRequest(API_ROUTES.tutorsSearch, "GET", params);

  const res = await axiosInstance.get(API_ROUTES.tutorsSearch, { params });
  logResponse(API_ROUTES.tutorsSearch, res.status, {
    count: Array.isArray(res.data?.items) ? res.data.items.length : 0,
  });

  return res.data;
}

export async function listEnrollments({
  q = "",
  campus,
  cycleId,
  status,
  classroomId,
  limit = 20,
  cursor,
} = {}) {
  const params = { limit };
  if (String(q || "").trim()) params.q = String(q).trim();
  if (campus) params.campus = campus;
  if (cycleId) params.cycleId = cycleId;
  if (status && status !== "ALL") params.status = status;
  if (classroomId && classroomId !== "ALL") params.classroomId = classroomId;
  if (cursor) params.cursor = cursor;

  logRequest(API_ROUTES.enrollmentsList, "GET", params);
  const res = await axiosInstance.get(API_ROUTES.enrollmentsList, { params });
  const items = Array.isArray(res.data?.items) ? res.data.items : [];

  logResponse(API_ROUTES.enrollmentsList, res.status, {
    count: items.length,
    nextCursor: res.data?.nextCursor || null,
  });

  return res.data;
}

export async function getEnrollmentDetail(enrollmentId) {
  const endpoint = API_ROUTES.enrollmentDetail(enrollmentId);

  logRequest(endpoint, "GET", {});
  const res = await axiosInstance.get(endpoint);
  logResponse(endpoint, res.status, {
    id: res.data?.id || null,
    status: res.data?.status || null,
    students: Array.isArray(res.data?.students) ? res.data.students.length : 0,
  });

  return res.data;
}

export async function updateEnrollmentContract(enrollmentId, payload) {
  const endpoint = API_ROUTES.enrollmentContract(enrollmentId);

  logRequest(endpoint, "PATCH", payload);
  const res = await axiosInstance.patch(endpoint, payload);
  logResponse(endpoint, res.status, res.data);

  return res.data;
}

export async function updateEnrollmentStudentCosts(enrollmentId, payload) {
  const endpoint = API_ROUTES.enrollmentStudentCosts(enrollmentId);

  logRequest(endpoint, "PATCH", payload);
  const res = await axiosInstance.patch(endpoint, payload);
  logResponse(endpoint, res.status, res.data);

  return res.data;
}

export async function mergeEnrollment(targetEnrollmentId, payload) {
  const endpoint = API_ROUTES.enrollmentMerge(targetEnrollmentId);
  logRequest(endpoint, "POST", payload);
  const res = await axiosInstance.post(endpoint, payload);
  logResponse(endpoint, res.status, res.data);
  return res.data;
}

export async function searchStudentsForEnrollments({ q, limit = 20 }) {
  const normalizedQuery = String(q || "").trim();
  if (normalizedQuery.length < 2) {
    return { items: [], total: 0 };
  }

  const params = { q: normalizedQuery, limit };
  logRequest(API_ROUTES.studentsSearch, "GET", params);

  const res = await axiosInstance.get(API_ROUTES.studentsSearch, { params });
  logResponse(API_ROUTES.studentsSearch, res.status, {
    count: Array.isArray(res.data?.items) ? res.data.items.length : 0,
  });

  return res.data;
}
