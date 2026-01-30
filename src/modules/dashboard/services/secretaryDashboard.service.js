// src/modules/dashboard/services/secretaryDashboard.service.js

import axiosInstance from "../../../lib/axios";

const BASE = "/api/dashboard/secretary";

// ✅ Cambia a false cuando tu backend tenga el endpoint listo
const USE_MOCK = true;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mockOverview() {
  const now = Date.now();

  return {
    kpis: {
      todayEnrollments: 4,
      monthEnrollments: 38,
      pendingPayments: 17,
      overduePayments: 6,
    },

    recentEnrollments: [
      {
        id: "enr_001",
        studentName: "Valeria Quispe",
        familyName: "Familia Quispe",
        gradeLabel: "2° Secundaria",
        createdAt: new Date(now - 8 * 60 * 1000).toISOString(),
      },
      {
        id: "enr_002",
        studentName: "Mateo López",
        familyName: "Familia López",
        gradeLabel: "5° Primaria",
        createdAt: new Date(now - 35 * 60 * 1000).toISOString(),
      },
      {
        id: "enr_003",
        studentName: "Ariana Gómez",
        familyName: "Familia Gómez",
        gradeLabel: "1° Secundaria",
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "enr_004",
        studentName: "Thiago Ramos",
        familyName: "Familia Ramos",
        gradeLabel: "3° Primaria",
        createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "enr_005",
        studentName: "Camila Torres",
        familyName: "Familia Torres",
        gradeLabel: "4° Secundaria",
        createdAt: new Date(now - 22 * 60 * 60 * 1000).toISOString(),
      },
    ],

    pendingPayments: [
      {
        id: "pay_001",
        familyName: "Familia Quispe",
        studentName: "Valeria Quispe",
        concept: "Pensión Febrero",
        amount: 120,
        dueDate: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "PENDING",
      },
      {
        id: "pay_002",
        familyName: "Familia López",
        studentName: "Mateo López",
        concept: "Matrícula 2026",
        amount: 150,
        dueDate: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "OVERDUE",
      },
      {
        id: "pay_003",
        familyName: "Familia Gómez",
        studentName: "Ariana Gómez",
        concept: "Pensión Febrero",
        amount: 120,
        dueDate: new Date(now + 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: "PENDING",
      },
      {
        id: "pay_004",
        familyName: "Familia Ramos",
        studentName: "Thiago Ramos",
        concept: "Pensión Febrero",
        amount: 120,
        dueDate: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "OVERDUE",
      },
    ],

    alerts: [
      {
        id: "al_001",
        type: "warning",
        title: "Pagos vencidos",
        description: "Hay 6 familias con pagos vencidos. Prioriza llamadas y recordatorios.",
      },
      {
        id: "al_002",
        type: "info",
        title: "Vacantes por confirmar",
        description: "Revisa vacantes disponibles antes de registrar nuevas matrículas.",
      },
      {
        id: "al_003",
        type: "success",
        title: "Flujo operativo OK",
        description: "No hay errores de sesión ni reportes críticos.",
      },
    ],
  };
}

async function getOverview() {
  // Esperado:
  // {
  //   kpis: { todayEnrollments, monthEnrollments, pendingPayments, overduePayments },
  //   recentEnrollments: [{ id, studentName, familyName, gradeLabel, createdAt }],
  //   pendingPayments: [{ id, familyName, studentName, concept, amount, dueDate, status }],
  //   alerts: [{ id, type, title, description }]
  // }

  if (USE_MOCK) {
    // Simula latencia real para que tu UI de loading tenga sentido
    await sleep(450);
    return mockOverview();
  }

  const { data } = await axiosInstance.get(`${BASE}/overview`);
  return data;
}

export const SecretaryDashboardService = { getOverview };
