# Plan de implementación de EasySell

## 1. Completar el esquema

Comparar las migraciones existentes con el modelo de datos. Completar todas las tablas, relaciones, restricciones e índices previstos en una sola etapa, sin dividir el esquema por entregas. Para cerrar la etapa, verificar con Flyway la instalación limpia y la actualización desde el esquema anterior, y comprobar con PostgreSQL la estructura y los criterios de aceptación.

## 2. Implementar los módulos de punta a punta

Para cada módulo, seguir esta secuencia:

1. **PostgreSQL.** Identificar las operaciones que requieren funciones SQL. Definir sus parámetros, resultados y límites transaccionales. Versionar las funciones con Flyway y verificar su comportamiento con datos válidos e inválidos.
2. **Backend.** Implementar los casos de uso, el acceso a datos con Npgsql y los endpoints de la API. Probar validación, permisos y persistencia. Para ventas, comprobar que un fallo en cualquier paso revierta la operación completa.
3. **Frontend.** Conectar las pantallas de React con la API y manejar los errores que puedan aparecer durante las consultas y el guardado. Verificar con los criterios de aceptación del requerimiento usando datos persistidos.

| Orden propuesto | Módulo                   | Dependencia que se verifica                                                                                         |
| --------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1               | Autenticación y usuarios | Identificar al usuario responsable y aplicar los permisos.                                                          |
| 2               | Productos                 | Disponer de productos para inventario y ventas.                                                                     |
| 3               | Inventario                | Registrar existencias y movimientos que participan en la venta.                                                     |
| 4               | Caja                      | Abrir un turno para registrar ventas. El corte y cierre con ventas reales se verifican después de integrar Ventas. |
| 5               | Ventas                    | Validar turno y existencias, guardar venta y partidas, y registrar movimientos en una transacción.                 |
| 6               | Reportes                  | Consultar los datos persistidos por los módulos que alimentan cada reporte.                                        |

El orden puede ajustarse a las dependenciaso de cada caso de uso o prioridad después de completar el esquema.
