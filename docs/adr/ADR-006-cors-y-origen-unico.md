# ADR-006: CORS y origen único

* **Estado:** Accepted
* **Fecha:** 2026-10-29
* **Autores:** Equipo del proyecto

## Contexto

En producción, el navegador accederá al frontend y a la API bajo el mismo origen,
pero durante el desarrollo local pueden ejecutarse en puertos distintos.

## Decisión

No se habilitará CORS en producción para el frontend propio. En desarrollo se
permitirá únicamente el origen local exacto del frontend y los métodos y
encabezados necesarios. Si una solicitud usa cookies, se habilitarán credenciales
solo para ese origen explícito; no se combinará `Access-Control-Allow-Origin: *`
con credenciales.

## Consecuencias

* La lista de orígenes de desarrollo será explícita y configurable.
* El navegador impedirá que JavaScript de un origen no autorizado lea la respuesta. CORS no sustituye autenticación, autorización ni protección CSRF; tampoco garantiza que la solicitud no llegue a ejecutarse en el servidor.
* La topología de producción deberá cumplir ADR-005.

## Referencias

* [ADR-005: Despliegue bajo un origen](ADR-005-despliegue-bajo-un-origen.md)
