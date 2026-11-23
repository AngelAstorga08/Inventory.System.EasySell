# ADR-001: Autenticación con JWT de acceso y refresh token

* **Estado:** Accepted
* **Fecha:** 2026-10-29
* **Autores:** Equipo del proyecto

## Contexto

La API necesita autenticar usuarios en solicitudes protegidas y permitir que mantengan su sesión sin volver a ingresar credenciales con frecuencia. El refresh token se enviará en una cookie del navegador.

## Opciones consideradas

### JWT de larga duración

Mantener un único JWT válido durante un periodo largo.

**Ventajas:** implementación sencilla.

**Desventajas:** una filtración conserva acceso durante toda su vigencia y la revocación inmediata es difícil.

### JWT corto y refresh token

Usar un JWT de acceso de corta duración y un refresh token de larga duración, renovable y revocable en servidor.

**Ventajas:** limita la exposición del token de acceso y permite revocar sesiones.

**Desventajas:** requiere persistir el estado de refresh tokens y manejar renovaciones.

## Decisión

Se utilizará un JWT de acceso de corta duración y un refresh token de larga duración almacenado en una cookie `HttpOnly` y `Secure`. El refresh token será opaco, aleatorio y validado contra un hash persistido en el servidor. Se rotará en cada uso exitoso del endpoint de renovación: se invalida el token anterior y se emite otro. En la versión inicial, la presentación de un token anterior se rechazará; no se agruparán tokens sucesivos en una familia ni se implementará detección de replay con revocación coordinada. Esas capacidades quedan como funcionalidades futuras. El cierre de sesión revocará el refresh token vigente de esa sesión. La cookie tendrá expiración alineada con la política del refresh token.

Al cerrar sesión, el servidor revocará el refresh token de la sesión y eliminará
su cookie; el cliente descartará el access token local. Se acepta que una copia
del JWT de acceso continúe siendo válida hasta su expiración. No se mantendrá
una lista de JWT revocados ni se consultará la revocación de la sesión en cada
solicitud para invalidar anticipadamente el access token por cierre de sesión.
Las sesiones de otros dispositivos no se cerrarán.

## Justificación

La corta vigencia limita el tiempo útil de un JWT filtrado; el hash persistido permite validar el refresh token sin guardar su valor original, y la rotación hace que el token anterior deje de servir tras una renovación exitosa.

## Consecuencias

### Positivas

* Se puede revocar el refresh token vigente al cerrar la sesión.
* El navegador no puede leer la cookie desde JavaScript por `HttpOnly`.

### Negativas

* La renovación requiere estado persistido y una operación atómica.
* El cliente debe coordinar renovaciones concurrentes por sesión.

### Riesgos

* Un JWT de acceso conservado antes del cierre de sesión podrá seguir usándose
  hasta expirar; esta ventana se acepta y queda limitada por su corta vigencia.
* Si dos renovaciones simultáneas presentan el mismo token, una puede invalidar a la otra; se requiere coordinación cliente y manejo server-side cuidadoso.
* En la versión inicial, rechazar un token antiguo no revoca automáticamente el refresh token vigente que lo sucedió.

## Implicaciones

* Definir expiraciones concretas, esquema de almacenamiento y revocación.
* Guardar secretos fuera del código y de archivos versionados.
* Definir cookie `SameSite` y protección CSRF en ADR-007.
* Añadir en una etapa futura la relación entre tokens de una sesión y respuesta ante reutilización (familias/replay).

## Criterios para reconsiderar la decisión

Reevaluar si se adopta un proveedor de identidad administrado, autenticación no basada en navegador o tokens vinculados criptográficamente a un cliente.

## Referencias

* [OAuth 2.0 Security Best Current Practice (RFC 9700)](https://datatracker.ietf.org/doc/html/rfc9700)
* [Seguridad de OAuth 2.0, OWASP](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
