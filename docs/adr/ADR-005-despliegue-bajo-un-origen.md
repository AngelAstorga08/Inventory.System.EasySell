# ADR-005: Despliegue bajo un origen

* **Estado:** Accepted
* **Fecha:** 2026-10-29
* **Autores:** Equipo del proyecto

## Contexto

El frontend React y la API necesitan comunicarse desde el navegador. Separarlos
por origen en producción agrega configuración CORS y complejidad al manejo de
cookies de autenticación.

## Decisión

En producción, frontend y API se expondrán bajo un mismo origen. El servidor de
entrada servirá el frontend en `/` y enrutará las solicitudes `/api/*` al backend.
El canal entre navegador y servidor utilizará HTTPS.

## Consecuencias

* Las solicitudes del navegador a la API serán del mismo origen.
* No se habilitará CORS en producción para el frontend propio.
* La infraestructura deberá conservar el enrutamiento por ruta y HTTPS.
* El desarrollo local puede usar orígenes distintos y se regirá por ADR-006.

## Referencias

* [ADR-006: CORS y origen único](ADR-006-cors-y-origen-unico.md)
* [ADR-007: SameSite y protección CSRF](ADR-007-samesite-strict.md)
