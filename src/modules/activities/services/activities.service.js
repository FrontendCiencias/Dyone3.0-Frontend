import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

function logRequest(endpoint, method, params) {
  console.log("[Activities][API][REQUEST]", { endpoint, method, params });
}

function logResponse(endpoint, status, dataSummary) {
  console.log("[Activities][API][RESPONSE]", { endpoint, status, dataSummary });
}

export async function listActivities(filters = {}) {
  logRequest(API_ROUTES.activities, "GET", filters);
  const res = await axiosInstance.get(API_ROUTES.activities, { params: filters });
  logResponse(API_ROUTES.activities, res.status, { count: Array.isArray(res.data?.items) ? res.data.items.length : 0 });
  return res.data;
}

export async function createActivity(payload) {
  logRequest(API_ROUTES.activities, "POST", payload);
  const res = await axiosInstance.post(API_ROUTES.activities, payload);
  logResponse(API_ROUTES.activities, res.status, res.data?.activity);
  return res.data;
}

export async function updateActivity(activityId, payload) {
  const endpoint = API_ROUTES.activityDetail(activityId);
  logRequest(endpoint, "PATCH", payload);
  const res = await axiosInstance.patch(endpoint, payload);
  logResponse(endpoint, res.status, res.data?.activity);
  return res.data;
}

export async function getActivityDetail(activityId) {
  const endpoint = API_ROUTES.activityDetail(activityId);
  logRequest(endpoint, "GET", {});
  const res = await axiosInstance.get(endpoint);
  logResponse(endpoint, res.status, {
    participants: Array.isArray(res.data?.participants) ? res.data.participants.length : 0,
    collections: Array.isArray(res.data?.collections) ? res.data.collections.length : 0,
  });
  return res.data;
}

export async function searchActivityStudents({ q, campus, limit = 10 } = {}) {
  const params = { q, limit };
  if (campus) params.campus = campus;
  logRequest(API_ROUTES.activitiesSearchStudents, "GET", params);
  const res = await axiosInstance.get(API_ROUTES.activitiesSearchStudents, { params });
  logResponse(API_ROUTES.activitiesSearchStudents, res.status, { count: Array.isArray(res.data?.items) ? res.data.items.length : 0 });
  return res.data;
}

export async function searchActivityCollectors({ q, campus, limit = 10 } = {}) {
  const params = { q, limit };
  if (campus) params.campus = campus;
  logRequest(API_ROUTES.activitiesSearchCollectors, "GET", params);
  const res = await axiosInstance.get(API_ROUTES.activitiesSearchCollectors, { params });
  logResponse(API_ROUTES.activitiesSearchCollectors, res.status, { count: Array.isArray(res.data?.items) ? res.data.items.length : 0 });
  return res.data;
}

export async function addActivityParticipant(activityId, payload) {
  const endpoint = API_ROUTES.activityParticipants(activityId);
  logRequest(endpoint, "POST", payload);
  const res = await axiosInstance.post(endpoint, payload);
  logResponse(endpoint, res.status, res.data?.participant);
  return res.data;
}

export async function createActivityCollection(activityId, payload) {
  const endpoint = API_ROUTES.activityCollections(activityId);
  logRequest(endpoint, "POST", payload);
  const res = await axiosInstance.post(endpoint, payload);
  logResponse(endpoint, res.status, res.data?.collection);
  return res.data;
}

export async function getActivityCollectionReceipt(collectionId) {
  const endpoint = API_ROUTES.activityCollectionReceipt(collectionId);
  logRequest(endpoint, "GET", {});
  const res = await axiosInstance.get(endpoint);
  logResponse(endpoint, res.status, res.data?.collection);
  return res.data;
}

export async function updateActivityCollection(collectionId, payload) {
  const endpoint = API_ROUTES.activityCollectionDetail(collectionId);
  logRequest(endpoint, "PATCH", payload);
  const res = await axiosInstance.patch(endpoint, payload);
  logResponse(endpoint, res.status, res.data?.collection);
  return res.data;
}
