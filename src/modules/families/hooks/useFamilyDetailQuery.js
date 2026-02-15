import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getFamilyDetail } from "../services/families.service";

export function useFamilyDetailQuery(familyId, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["families", "detail", familyId],
    queryFn: () => getFamilyDetail(familyId),
    enabled: Boolean(token) && Boolean(familyId) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
