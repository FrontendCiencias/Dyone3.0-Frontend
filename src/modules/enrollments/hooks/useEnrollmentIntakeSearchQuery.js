import { useQuery } from "@tanstack/react-query";
import { searchEnrollmentIntake } from "../services/enrollments.service";

export function useEnrollmentIntakeSearchQuery({ q, campusScope, enabled = true }) {
  return useQuery({
    queryKey: ["enrollments", "intake-search", String(q || "").trim(), campusScope || ""],
    queryFn: () => searchEnrollmentIntake({ q, campusScope }),
    enabled: enabled && String(q || "").trim().length >= 2,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
