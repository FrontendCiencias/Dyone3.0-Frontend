import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../lib/auth";
import OperationalContextBar from "../../../shared/ui/OperationalContextBar";
import { ROUTES } from "../../../config/routes";
import DailyCashReviewSection from "../components/DailyCashReviewSection";

export default function PaymentsDailyCashPage() {
  const navigate = useNavigate();
  const { activeCampus } = useAuth();

  return (
    <div className="space-y-4">
      <OperationalContextBar
        items={[
          { key: "Campus", value: activeCampus === "ALL" ? "Todos" : activeCampus || "Todos" },
          { key: "Vista", value: "Caja del día" },
          { key: "Fuente", value: "Pagos registrados", grow: true },
        ]}
        onBack={() => navigate(ROUTES.dashboardPayments)}
        backLabel="Volver a pagos"
      />
      <DailyCashReviewSection campus={activeCampus === "ALL" ? undefined : activeCampus} showHeader={false} />
    </div>
  );
}
