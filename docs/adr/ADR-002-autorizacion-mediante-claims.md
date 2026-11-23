# ADR-002: Autorización mediante claims

* **Estado:** Accepted
* **Fecha:** 2026-10-29
* **Autores:** Equipo del proyecto

## Contexto

La API debe limitar cada operación según el usuario autenticado y su rol. La
identidad y los permisos deben provenir de información validada por el servidor,
no de valores enviados libremente en el cuerpo de una solicitud.

## Decisión

Se utilizarán claims del principal autenticado para representar el identificador
del usuario y su rol. Los endpoints y casos de uso aplicarán autorización según
esos claims. Las operaciones que registren ventas o movimientos asociarán al
usuario obtenido del contexto autenticado.

## Consecuencias

* Las solicitudes sin identidad válida recibirán `401`; las identidades sin el
  permiso requerido recibirán `403`.
* La API no confiará en un identificador de usuario proporcionado por el cliente
  para atribuir operaciones.
* Los cambios de rol deberán reflejarse en los tokens emitidos conforme a la
  política de expiración y renovación definida para la autenticación.

## Referencias

* [ADR-001: Autenticación con JWT de acceso y refresh token](ADR-001-autenticacion-jwt-y-refresh-token.md)
