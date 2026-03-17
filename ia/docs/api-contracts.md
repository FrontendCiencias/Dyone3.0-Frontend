# API Contracts críticos (Frontend ↔ Backend)

> Objetivo: evitar rupturas en integración en flujos de matrícula, familia, admin y documentos.

## 1) POST `/api/enrollments`
Crea matrícula de forma directa (sin confirmación posterior en frontend).

### Request (esperado)
```json
{
  "familyId": "string(ObjectId)",
  "campusId": "string(ObjectId)",
  "cycleId": "string(ObjectId)",
  "notes": "string(opcional)",
  "originSchool": "string(opcional)",
  "packageItems": [
    {
      "studentId": "string(ObjectId)",
      "classroomId": "string(ObjectId)",
      "admissionFee": {
        "applies": true,
        "amount": 0,
        "isExempt": false,
        "reason": "string(opcional)"
      },
      "enrollmentFee": {
        "amount": 0,
        "isExempt": false,
        "reason": "string(opcional)"
      },
      "pensionMonthlyAmounts": [0],
      "previousSchoolName": "string(opcional)",
      "previousSchoolType": "CIMAS|CIENCIAS|CIENCIAS_APLICADAS|OTHER",
      "notes": "string(opcional)"
    }
  ]
}
```

### Reglas de mapeo frontend
- `classroomId` se debe construir desde `selectedClassroomId` en UI.
- `packageItems` representa alumnos + costos acordados.
- No implementar flujo de “confirmar matrícula” luego de este POST.

---

## 2) GET `/api/admin/billing-schedule`
Obtiene el cronograma de conceptos/fechas para ciclo(s) y configuración administrativa.

### Uso frontend
- Fuente de datos de la tabla de BillingSchedule en módulo admin.
- Debe mostrar `conceptCode`, `dueDate`, `label`, `monthIndex`, `cycleId`.

---

## 3) POST `/api/admin/billing-schedule`
Crea/actualiza registros de cronograma de cobros del ciclo.

### Request base
```json
{
  "cycleId": "string(ObjectId)",
  "conceptCode": "string",
  "dueDate": "ISODate",
  "label": "string(opcional)",
  "monthIndex": 1
}
```

### Notas
- `conceptCode` debe corresponder a códigos válidos de conceptos de cobro.
- Mantener formato de fecha consistente (ISO) desde frontend.

---

## 4) PATCH `/api/families/:id`
Actualiza información de familia (ej. dirección, notas y datos relacionados permitidos por backend).

### Buenas prácticas frontend
- Enviar solo campos editables realmente modificados.
- Invalidar queries de familia y vistas relacionadas tras éxito.

---

## 5) POST `/api/students/print-cards`
Genera datos para vista previa de cards de alumnos.

### Uso frontend
- Abrir resultado en nueva pestaña con layout de impresión (sin dashboard).
- Ocultar controles de preview en modo impresión.
- No disparar impresión automática.

---

## 6) GET `/api/students/:id/summary`
Obtiene resumen operativo del alumno para expediente y flujo de matrícula.

### Datos sensibles para matrícula
- `enrollmentStatus.classroom.id` o `enrollmentStatus.classroomId` se usan para hidratar `selectedClassroomId` en UI.
- Este resumen también alimenta decisiones de edición rápida (identidad/aula) desde modales reutilizables.
