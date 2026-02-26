import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";
import { useAuth } from "../../../lib/auth";

export function useLoginMutation({ onSuccessNavigate } = {}) {
  const queryClient = useQueryClient();
  const { setSession } = useAuth();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await axiosInstance.post(API_ROUTES.login, { email, password });
      return res.data; // { token }
    },
    retry: false,
    onSuccess: async (data) => {
      const token = data?.token || null;

      // 1) Guarda token en state + storage (AuthProvider)
      setSession({ token });

      // 2) Trae /me con el token ya activo en interceptor
      const meData = await queryClient.fetchQuery({
        queryKey: ["auth", "me"],
        queryFn: async () => {
          const res = await axiosInstance.get(API_ROUTES.me);
          return res.data;
        },
        staleTime: 0,
      });

      const roles = Array.isArray(meData?.roles) ? meData.roles : [];
      const scope = Array.isArray(meData?.campusScope) ? meData.campusScope : meData?.user?.campusScope;

      // 3) Actualiza state + storage inmediatamente (sin refresh)
      setSession({
        user: meData?.user || null,
        roles,
        campusScope: scope,
      });

      // 4) Deja cache consistente
      queryClient.setQueryData(["auth", "me"], meData);

      onSuccessNavigate?.(meData);
    },
  });
}
