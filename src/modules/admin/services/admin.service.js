import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

export async function getCampuses() {
  const res = await axiosInstance.get(API_ROUTES.adminCampuses);
  return res.data;
}

export async function createCampus(payload) {
  const res = await axiosInstance.post(API_ROUTES.adminCampuses, payload);
  return res.data;
}

export async function getCycles() {
  const res = await axiosInstance.get(API_ROUTES.adminCycles);
  return res.data;
}

export async function createCycle(payload) {
  const res = await axiosInstance.post(API_ROUTES.adminCycles, payload);
  return res.data;
}

export async function getClassrooms() {
  const res = await axiosInstance.get(API_ROUTES.adminClassrooms);
  return res.data;
}

export async function createClassroom(payload) {
  const res = await axiosInstance.post(API_ROUTES.adminClassrooms, payload);
  return res.data;
}

export async function getBillingConcepts() {
  const res = await axiosInstance.get(API_ROUTES.adminBillingConcepts);
  return res.data;
}

export async function createBillingConcept(payload) {
  const res = await axiosInstance.post(API_ROUTES.adminBillingConcepts, payload);
  return res.data;
}
