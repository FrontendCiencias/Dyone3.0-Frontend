# DYONE 3.0 Frontend — AI Context

## Qué es DYONE
DYONE 3.0 Frontend es la aplicación web para gestión operativa escolar, con foco en matrícula, familias, estudiantes y administración académica/financiera.

## Stack frontend
- React
- React Query
- React Router
- TailwindCSS

## Módulos principales
- `enrollments`: creación y gestión de matrículas.
- `students`: expediente del alumno, identidad y aula.
- `families`: datos de familia y tutores.
- `admin`: catálogos y configuración (campus, ciclos, aulas, billing schedule).

## Flujo crítico: Nueva Matrícula
1. Seleccionar familia.
2. Construir `packageItems` por alumno.
3. Definir costos por alumno (admisión, matrícula, pensiones según aplique).
4. Asignar aula por alumno mediante `selectedClassroomId`.
5. Enviar a `POST /api/enrollments`.

**Regla clave:** la matrícula se crea directamente confirmada en backend; no existe paso ni botón posterior de “Confirmar matrícula”.

## Coordinación con backend
- El frontend **solo orquesta datos**; el backend aplica reglas transaccionales y genera cargos.
- `selectedClassroomId` en UI se mapea a `classroomId` en el payload final de matrícula.
- Si el backend ya conoce el aula del alumno, la UI debe hidratar `selectedClassroomId` desde:
  - `summary.enrollmentStatus.classroom.id`, o
  - `summary.enrollmentStatus.classroomId`.

## Previews (contrato y cards)
- El preview de contrato abre en **nueva pestaña** y no debe renderizar dashboard/layout administrativo.
- El preview de impresión de cards abre en **nueva pestaña** y tampoco usa dashboard/layout administrativo.
- Los botones de preview no deben aparecer en impresión.
- No hay auto-impresión: el usuario revisa y luego decide imprimir.

## Reglas que NO se deben romper
- No reintroducir flujo de confirmación manual de matrícula.
- No mover generación de cargos al frontend.
- No romper contratos de endpoints existentes.
- No acoplar vistas de preview al layout del dashboard.
- Reutilizar modales y hooks existentes antes de crear duplicados.
