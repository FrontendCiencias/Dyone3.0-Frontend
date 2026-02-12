import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";
import { getToken } from "../../../lib/authStorage";
import { useAuth } from "../../../lib/auth";

export function useMeQuery() {
  const token = getToken();
  const { setSession, logout } = useAuth();

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
      setSession({
        user: data?.user || null,
        roles,
        activeRole: roles[0] || null,
      });
    },
    onError: () => {
      // si /me falla => sesión inválida
      logout();
    },
  });
}
