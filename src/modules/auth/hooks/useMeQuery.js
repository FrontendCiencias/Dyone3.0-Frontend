import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";
import { getToken } from "../../../lib/authStorage";
import { useAuth } from "../../../lib/auth";

export function useMeQuery() {
  const token = getToken();
  const { setSession, logout, activeRole } = useAuth();

  return useQuery({
    queryKey: ["auth", "me"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await axiosInstance.get(API_ROUTES.me);
      return res.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    onSuccess: (data) => {
      const roles = Array.isArray(data?.roles) ? data.roles : [];
      const RoleNow = activeRole;
      setSession({
        user: data?.user || null,
        roles,
        activeRole: RoleNow?RoleNow:roles[0] || null,
      });
    },
    onError: () => {
      logout();
    },
  });
}
