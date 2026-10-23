# Datos temporales de impresión

Los listados usan una clave aleatoria por trabajo para compartir su instantánea
con una pestaña nueva. `src/shared/utils/printStorage.mjs` concentra su ciclo de
vida; `usePrintPreview` lo conecta con todas las vistas previas que usan estos datos.

## Recuperación y caducidad

- Al arrancar la aplicación y antes de guardar una impresión se eliminan trabajos
  vencidos. No se necesita acceso técnico al equipo: después del despliegue, una
  recarga que cargue el código nuevo ejecutará la limpieza.
- **Retención inactiva: 2 horas** desde el timestamp de la clave. El mismo formato
  permite limpiar datos heredados sin reescribir los listados en navegadores llenos.
- Cada vista abierta renueva una pequeña **lease de 30 minutos cada minuto**, y
  al recuperar visibilidad o volver de BFCache. Esta tolerancia evita depender de
  timers exactos de pestañas en segundo plano. Las vistas mantienen sus datos en
  memoria; otra pestaña no limpia un trabajo con una lease vigente.
- Al salir normalmente (`pagehide` no persistido), la lease pasa a una **gracia de
  1 minuto**. El siguiente barrido elimina el trabajo si no hay otra vista activa.
  No se borra inmediatamente porque ese evento también ocurre al recargar.
- El botón **Cerrar** elimina inmediatamente su trabajo cuando ninguna otra vista
  lo protege. El desmontaje de efectos solo libera la lease con gracia, para no
  romper el montaje doble de React StrictMode ni la navegación.
- BFCache no se considera cierre. Cierres inesperados que no disparan eventos se
  recuperan mediante caducidad y barridos posteriores.

La retención es temporal, no una garantía de almacenamiento indefinido. Un navegador
que suspenda una pestaña más de 30 minutos puede perder su respaldo si otro tab hace
un barrido después de las 2 horas. Igualmente, si no hay ni espacio para la pequeña
lease, su escritura es best-effort: la vista ya cargada sigue funcionando en memoria,
pero su recarga queda sujeta a la retención inactiva. No se duplican listados grandes
ni se reserva espacio robándolo a trabajos recientes.

## Alcance seguro

Solo se reconocen claves completas `<prefijo>-<timestamp de 13 dígitos>-<aleatorio>`:

- `payments-debtors-print`, `payments-debtors-list`, `payments-debtors-letters`
- `payments-caja-arequipa-print`
- `student-print-cards`
- `classroom-roster-print`
- `enrollment-contract-preview-v2`

Los metadatos son `__print-preview-lease__:<clave>:<identificador de vista>`.
Nunca se usa `localStorage.clear()` ni se borran autenticación, preferencias,
sesiones de asistencia, claves desconocidas o impresiones recientes para hacer
espacio. Los payloads siguen siendo JSON sin envoltorios, compatibles con el formato
anterior. Una pestaña anterior al despliegue no publica leases: su respaldo tiene
la retención de 2 horas, aunque la vista que ya cargó conserva los datos en memoria.

## Errores

Ante `QuotaExceededError`, se hace otro barrido seguro y **un solo reintento** de
la escritura. Si no alcanza el espacio, la pantalla solicita cerrar vistas de
impresión innecesarias o reducir el lote. No se confunden errores de permisos de
almacenamiento con cuota agotada. Un error de preparación de contrato después de
matricular no altera el éxito de la matrícula; solo se guarda el contrato temporal
cuando se pide su vista previa, no al finalizar la matrícula.

## Verificación sin build ni dependencias del frontend

```powershell
node --test test/printStorage.test.mjs
```

También disponible como `npm run test:print-storage`. Las pruebas unitarias simulan
Storage, tiempo y eventos del navegador; no sustituyen una prueba visual real de
impresión ni un build. Casos manuales recomendados tras desplegar: vista previa y
recarga en cada módulo, dos pestañas para el mismo trabajo, cierre nativo/botón,
cuota agotada, bloqueo de almacenamiento y matrícula exitosa seguida de fallo al
preparar contrato.
