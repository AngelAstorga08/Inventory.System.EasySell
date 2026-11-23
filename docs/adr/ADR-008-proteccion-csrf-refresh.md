# ADR-008: Protección CSRF del endpoint de renovación

* **Estado:** Proposed
* **Fecha:** 2026-10-29
* **Autores:** Equipo del proyecto

## Contexto

El navegador envía automáticamente la cookie que contiene el refresh token. Por
ello, el endpoint de renovación requiere protección frente a solicitudes
cross-site. `SameSite=Strict` reduce la superficie de ataque, pero debe tratarse
como defensa adicional y no como única validación del endpoint.

## Decisión propuesta

El endpoint de renovación validará que la solicitud provenga del origen esperado
y requerirá una señal anti-CSRF explícita que no se envíe automáticamente como
cookie. El mecanismo concreto y su integración con el cliente se definirán al
implementar autenticación. El refresh token seguirá protegido en una cookie
`HttpOnly`, `Secure` y `SameSite=Strict` conforme a ADR-001 y ADR-007.

## Consecuencias

* Las solicitudes de renovación que no cumplan la validación anti-CSRF serán
  rechazadas.
* La configuración de orígenes deberá coincidir con ADR-005 y ADR-006.
* Esta decisión seguirá propuesta hasta documentar y probar el mecanismo concreto.

## Referencias

* [ADR-001: Autenticación con JWT y refresh token](ADR-001-autenticacion-jwt-y-refresh-token.md)
* [ADR-005: Despliegue bajo un origen](ADR-005-despliegue-bajo-un-origen.md)
* [ADR-006: CORS y origen único](ADR-006-cors-y-origen-unico.md)
* [ADR-007: SameSite y protección CSRF](ADR-007-samesite-strict.md)
