# ADR-004: Rate limiting por tipo de endpoint

* **Estado:** Accepted
* **Fecha:** 2026-10-29
* **Autores:** Equipo del proyecto

## Contexto

La API debe reducir fuerza bruta, abuso de cuentas y sobrecarga accidental, sin imponer un límite único inadecuado a operaciones de distinta sensibilidad.

## Opciones consideradas

### Una política fija global

Aplicar el mismo límite y ventana a todos los endpoints.

### Una política deslizante global

Aplicar una ventana deslizante a todos los endpoints para distribuir solicitudes uniformemente.

### Políticas por categoría de endpoint

Aplicar políticas específicas a login, renovación, endpoints autenticados y operaciones costosas.

## Decisión

Se usarán políticas por categoría:

* Login público: ventana deslizante particionada por IP; se podrá añadir una partición por cuenta de manera que no facilite el bloqueo malicioso de cuentas.
* Renovación de refresh token: política propia, ventana deslizante estricta por IP y por el refresh token presentado. Las familias de tokens quedan fuera del alcance inicial, conforme a ADR-001.
* Endpoints protegidos generales: ventana deslizante con un límite amplio por usuario autenticado, como protección contra automatización, bucles de reintento y abuso de una cuenta.
* Operaciones costosas: límite de concurrencia si el perfil de carga lo justifica.

Los umbrales concretos quedan pendientes de definir con base en el uso esperado y métricas. Los rechazos responderán `429` y `Retry-After` cuando se pueda calcular.

## Justificación

La ventana deslizante se usará en todas las categorías para evitar ráfagas en los límites de intervalos y mantener un comportamiento temporal uniforme. Las políticas seguirán diferenciándose por umbral y partición según la sensibilidad del flujo. Login y renovación tendrán límites más estrictos; los endpoints protegidos generales tendrán un límite amplio por usuario autenticado. Los límites se ajustarán con métricas.

## Consecuencias

### Positivas

* La protección se ajusta al riesgo y patrón de cada endpoint.

### Negativas

* Hay varias políticas y los umbrales necesitan observación y ajuste.

### Riesgos

* Contadores locales en múltiples instancias no garantizan un límite global.
* IP reenviada debe confiarse solo desde proxies configurados.

## Implicaciones

* Configurar particiones y límites al implementar middleware.
* Evaluar almacenamiento distribuido si la API escala a varias instancias.

## Criterios para reconsiderar la decisión

Reevaluar por métricas, aumento de instancias, falsos positivos o cambio material de los patrones de tráfico.

## Referencias

* [Rate limiting en ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0)
