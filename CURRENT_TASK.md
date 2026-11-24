# Completar el esquema de tablas de PostgreSQL

## Objetivo y alcance

Completar en una sola etapa el esquema relacional de todos los módulos de EasySell definidos en el [modelo de datos](project-documentation.md#8-modelo-de-datos). El alcance incluye tablas, columnas, tipos, relaciones, restricciones e índices que respalden las consultas previstas. Las funciones SQL y la integración con la API y React se realizan en las etapas siguientes.

## Punto de partida

| Migraciones presentes en el repositorio | Diseño pendiente de reflejar en las migraciones |
| --- | --- |
| `users`, `products`, `sales`, `sale_items` y `stock_movements`. | `user_sessions`, `cash_shifts`, `cash_closings`, `report_schedules` y la relación de ventas con turnos de caja. |

Revisar también las tablas existentes contra el modelo documentado. Para modificar una migración ya aplicada, agregar una nueva migración versionada de acuerdo con la [guía de Flyway](../Inventory.System.Database/README.md).

## Reglas y convenciones

Usar como referencia las [reglas de negocio](project-documentation.md#5-reglas-de-negocio) y el [modelo de datos completo](project-documentation.md#8-modelo-de-datos). Aplicar en el esquema las reglas que PostgreSQL puede garantizar con claves y restricciones. Las reglas que dependen de ejecutar un caso de uso se comprueban al implementar ese flujo.

- Generar los archivos con `tools/new-sql.sh` desde `Inventory.System.Database`. Por ejemplo, `bash tools/new-sql.sh migration cash_shifts --operation create`.
- Guardar las migraciones en `migrations/V<timestamp_UTC>__<operation>_<name>.sql`. Usar nombres descriptivos en minúsculas con guiones bajos y la operación correspondiente (`create`, `alter`, `delete` para `DROP`, o `insert`).
- Conservar el encabezado generado en inglés con `Path`, `Author` y `Created at`. Los cambios a migraciones ya aplicadas se registran en un archivo nuevo.

## Criterios de aceptación

- Flyway crea el esquema completo en una base vacía y aplica las migraciones pendientes sobre una base con el esquema anterior. La actualización conserva los datos existentes.
- Todas las tablas del modelo están representadas y sus claves, tipos y relaciones coinciden con el diseño acordado. Si existen ventas previas a la relación con caja, el tratamiento de esas filas queda definido y probado.
- PostgreSQL rechaza referencias inexistentes, folios duplicados, existencias negativas, cantidades de venta menores o iguales a cero y más de un cierre para el mismo turno. La apertura con monto inicial cero es válida.
- La estructura resultante y el diagrama ER coinciden. Las reglas transaccionales de los casos de uso, como validar que el turno siga abierto al registrar una venta, se verifican al implementar los módulos.

El [plan de implementación](IMPLEMENTATION_PLAN.md) define el orden de trabajo.

## Cómo comprobar que está listo

1. En una base de prueba vacía, ejecutar `migrate`, `validate` e `info` con el wrapper de Flyway. Confirmar que los comandos terminan correctamente y que `info` no muestra migraciones pendientes.
2. Comparar el catálogo de PostgreSQL con el modelo de datos. Revisar cada tabla, sus columnas y tipos, claves, restricciones e índices previstos.
3. Ejecutar operaciones SQL válidas e inválidas para comprobar los criterios de aceptación. Repetir la migración sobre una base de prueba con el esquema anterior y datos representativos para verificar su conservación.