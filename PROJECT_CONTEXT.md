# Contexto de EasySell

EasySell ayuda a una tienda de abarrotes a registrar ventas, controlar existencias y operar la caja. El proyecto contempla autenticación y usuarios, productos, inventario, ventas, caja y reportes.

El repositorio reúne un frontend React con TypeScript y Vite, un backend .NET 10 organizado con Clean Architecture y una base PostgreSQL. Flyway gestiona el esquema y las funciones SQL. El backend usa Npgsql como tecnología de acceso a datos. El frontend actual sirve como prototipo y guarda los cambios de demostración en el navegador.

## Reglas y restricciones

- Una venta requiere un turno de caja abierto y productos activos con existencias suficientes. El precio aplicado se conserva en cada partida.
- Las existencias deben ser no negativas. Registrar una venta, sus partidas y los cambios de inventario requiere una transacción.
- La apertura de caja requiere declarar un monto inicial y admite cero.
- El esquema relacional completo se construye en una sola etapa y cubre todos los módulos del alcance definido. Después se implementan las funciones SQL, el backend y el frontend por módulo.

Consulta el [alcance, los requerimientos y el modelo de datos](project-documentation.md) y los [registros de decisiones de arquitectura](adr.md). La [tarea actual](CURRENT_TASK.md) y el [plan de implementación](IMPLEMENTATION_PLAN.md) detallan el trabajo pendiente.
