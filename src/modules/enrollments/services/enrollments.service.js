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

export async function createQuickEnrollment(payload) {
  logRequest(API_ROUTES.enrollments, "POST", payload);

  const res = await axiosInstance.post(API_ROUTES.enrollments, payload);

  logResponse(API_ROUTES.enrollments, res.status, res.data);

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
