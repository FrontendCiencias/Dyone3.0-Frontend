# Arquitectura y decisiones permanentes

## Decisiones de producto/técnicas vigentes
1. **Matrícula directa**
   - `POST /api/enrollments` registra la matrícula en estado operativo final (sin confirmación manual posterior en frontend).

2. **Responsabilidad financiera en backend**
   - El frontend no calcula ni persiste cargos finales como fuente de verdad.
   - El backend genera cargos y estados financieros derivados de la matrícula.

3. **Fuente de aula por alumno**
   - En UI se usa `selectedClassroomId`.
   - En payload de matrícula se envía como `classroomId`.
   - Al cargar datos existentes, se hidrata desde `summary/enrollmentStatus.classroom.id` o `classroomId`.

4. **Previews desacoplados del dashboard**
   - Contrato y print-cards se renderizan en rutas/vistas de nueva pestaña sin layout del dashboard.
   - Estas vistas priorizan legibilidad de impresión y control explícito del usuario.

5. **Reutilización sobre duplicación**
   - Antes de crear componentes nuevos, reutilizar:
     - modales de edición de identidad del alumno,
     - modales de cambio de aula,
     - patrones de tabla/admin existentes (ej. BillingSchedule).

6. **Data fetching estandarizado**
   - Priorizar React Query y hooks ya existentes para cache, invalidación y estados de carga/error.
   - Evitar fetches ad-hoc en componentes cuando exista hook de dominio.

7. **Cambios mínimos y compatibles**
   - Mantener rutas, contratos y comportamiento actual salvo requerimiento explícito.
   - Optimizar consistencia funcional antes que refactors amplios.
