import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

export async function getBillingSchedule(cycleId) {
  const response = await axiosInstance.get(API_ROUTES.adminBillingSchedule, {
    params: { cycleId },
  });

  return response.data;
}

export async function createBillingSchedule(payload) {
  const response = await axiosInstance.post(API_ROUTES.adminBillingSchedule, payload);
  return response.data;
}
