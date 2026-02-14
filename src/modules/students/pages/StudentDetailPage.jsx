import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { ROUTES } from "../../../config/routes";

export default function StudentDetailPage() {
  const navigate = useNavigate();
  const { studentId } = useParams();

  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="space-y-3 p-1">
        <h1 className="text-xl font-semibold text-gray-900">Editar alumno</h1>
        <p className="text-sm text-gray-600">
          Vista temporal de detalle para el alumno <span className="font-medium">{studentId || "-"}</span>. Aquí se
          conectará la edición completa.
        </p>
        <div>
          <Button type="button" onClick={() => navigate(ROUTES.dashboardStudents)}>
            Volver a estudiantes
          </Button>
        </div>
      </div>
    </Card>
  );
}
