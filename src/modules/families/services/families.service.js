import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

function logRequest(endpoint, method, params) {
  console.log("[Families][API][REQUEST]", { endpoint, method, params });
}

function logResponse(endpoint, status, dataSummary) {
  console.log("[Families][API][RESPONSE]", { endpoint, status, dataSummary });
}

export async function searchFamilies({ q = "", limit = 20 }) {
  const normalizedQuery = String(q || "").trim();
  const params = { limit };
  if (normalizedQuery) params.q = normalizedQuery;

  logRequest(API_ROUTES.familiesSearch, "GET", params);
  const res = await axiosInstance.get(API_ROUTES.familiesSearch, { params });
  logResponse(API_ROUTES.familiesSearch, res.status, { count: res.data?.items?.length || 0 });
  return res.data;
}

export async function getFamilyDetail(id) {
  const endpoint = API_ROUTES.familyDetail(id);
  logRequest(endpoint, "GET", {});
  const res = await axiosInstance.get(endpoint);
  logResponse(endpoint, res.status, res.data);
  return res.data;
}

export async function createFamily(payload = {}) {
  logRequest(API_ROUTES.families, "POST", payload);
  const res = await axiosInstance.post(API_ROUTES.families, payload);
  logResponse(API_ROUTES.families, res.status, res.data);
  return res.data;
}

export async function linkStudentFamily(payload) {
  logRequest(API_ROUTES.familiesLinkStudent, "POST", payload);
  const res = await axiosInstance.post(API_ROUTES.familiesLinkStudent, payload);
  logResponse(API_ROUTES.familiesLinkStudent, res.status, res.data);
  return res.data;
}

export async function searchStudentsForFamily({ q = "", limit = 10 }) {
  const params = { limit };
  if (q?.trim()) params.q = q.trim();

  logRequest(API_ROUTES.studentsSearch, "GET", params);
  const res = await axiosInstance.get(API_ROUTES.studentsSearch, { params });
  logResponse(API_ROUTES.studentsSearch, res.status, { count: res.data?.items?.length || 0 });
  return res.data;
}

export async function createStudentFromFamily(payload) {
  logRequest(API_ROUTES.students, "POST", payload);
  const res = await axiosInstance.post(API_ROUTES.students, payload);
  logResponse(API_ROUTES.students, res.status, res.data);
  return res.data;
}

export async function createTutor(payload) {
  logRequest(API_ROUTES.createTutor, "POST", payload);
  const res = await axiosInstance.post(API_ROUTES.createTutor, payload);
  logResponse(API_ROUTES.createTutor, res.status, res.data);
  return res.data;
}


export async function updateFamilyPrimaryTutor({ familyId, tutorId }) {
  const endpoint = API_ROUTES.familyPrimaryTutor(familyId);
  const payload = { tutorId };

  logRequest(endpoint, "PATCH", payload);
  const res = await axiosInstance.patch(endpoint, payload);
  logResponse(endpoint, res.status, res.data);
  return res.data;
}
