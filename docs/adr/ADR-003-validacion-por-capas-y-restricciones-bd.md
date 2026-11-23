# ADR-003: Validación por capas y restricciones en la base de datos

* **Estado:** Accepted
* **Fecha:** 2026-10-29
* **Autores:** Equipo del proyecto

## Contexto

Las entradas inválidas o reglas de negocio omitidas pueden producir datos
inconsistentes. Validar en un único nivel no protege contra errores internos,
concurrencia ni escrituras que eludan la API.

## Decisión

La validación se aplicará en las capas que conocen cada regla: la API validará
la forma de la solicitud, Application y Domain validarán reglas de negocio, y
la base de datos impondrá restricciones de integridad como última barrera.
Se usarán restricciones `NOT NULL`, `UNIQUE`, `CHECK` y claves foráneas cuando
correspondan.

La API traducirá errores de validación e integridad a respuestas entendibles;
los detalles internos de la base de datos no se expondrán al cliente.

## Consecuencias

* Las reglas críticas no dependerán únicamente de la interfaz o de la API.
* Cada capa rechazará errores apropiados a su responsabilidad.
* Las escrituras concurrentes deberán mantener las restricciones y la
  consistencia transaccional.

## Referencias

* [Manejo de errores](../project-documentation.md#13-manejo-de-errores)
