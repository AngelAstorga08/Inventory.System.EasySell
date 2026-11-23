# ADR-007: SameSite y protección CSRF de la cookie de refresh

* **Estado:** Accepted
* **Fecha:** 2026-10-29
* **Autores:** Equipo del proyecto

## Contexto

El refresh token se almacenará en una cookie y el objetivo de despliegue sirve frontend y API bajo el mismo origen. Los navegadores adjuntan cookies automáticamente, lo cual puede habilitar solicitudes CSRF si no se valida el origen de la operación.

## Opciones consideradas

### `SameSite=Strict` sin otra defensa

Restringir la cookie al contexto del mismo sitio. Esta opción reduce el envío
cross-site, pero deja la renovación dependiendo de una sola defensa.

### `SameSite=Lax` sin otra defensa

Permitir la cookie en solicitudes del mismo sitio y navegación superior segura desde otro sitio, bloqueando normalmente subsolicitudes y métodos inseguros cross-site.

### `SameSite=Strict` más validación de origen/anti-CSRF

Usar Strict como mitigación de navegador y validar además el origen o una prueba
anti-CSRF en la operación sensible que consume la cookie.

## Decisión

La cookie de refresh usará `SameSite=Strict`, además de `HttpOnly` y `Secure`.
El endpoint de renovación tendrá una defensa explícita contra CSRF mediante
validación de origen o token antiforgery, definida durante la implementación.
No se usará `SameSite=None` mientras el flujo permanezca bajo el mismo origen.

## Justificación

Strict es coherente con el despliegue bajo un único origen y reduce el envío de
la cookie desde contextos externos. La defensa adicional evita tratar SameSite
como única barrera, porque el endpoint de renovación opera con una cookie que el
navegador adjunta automáticamente.

## Consecuencias

### Positivas

* La cookie no se expone a JavaScript y se restringe en solicitudes cross-site.
* El endpoint de renovación obtiene una comprobación CSRF explícita.

### Negativas

* El frontend debe obtener y enviar la prueba antiforgery si se elige el patrón de token.

### Riesgos

* El despliegue real o navegadores con políticas de cookies restrictivas pueden cambiar el comportamiento; se debe validar el flujo en navegadores objetivo.

## Implicaciones

* No realizar cambios de estado mediante `GET`.
* Definir el mecanismo concreto y probarlo en el endpoint de refresh.

## Criterios para reconsiderar la decisión

Si el frontend y la API pasan a sitios distintos, revisar `SameSite`, `Secure`, CORS, cookies de terceros y CSRF antes de habilitar `SameSite=None`.

## Referencias

* [Protección CSRF en ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0)
* [Cookies SameSite en ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/samesite?view=aspnetcore-10.0)
