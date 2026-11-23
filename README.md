# Inventory System

## Convención de nombres de ramas

Las ramas de trabajo utilizan el formato `tipo/descripcion-corta`, en minúsculas y con palabras separadas por guiones. Se recomienda utilizar descripciones en inglés de forma consistente.

| Prefijo | Uso | Ejemplo |
| --- | --- | --- |
| `feature/` | Nueva funcionalidad. | `feature/register-sale` |
| `fix/` | Corrección de un error no urgente. | `fix/product-stock-validation` |
| `hotfix/` | Corrección urgente de un problema en producción. | `hotfix/login-failure` |
| `refactor/` | Reorganización del código sin cambiar el comportamiento esperado. | `refactor/product-repository` |
| `docs/` | Cambios en la documentación. | `docs/database-cicd` |
| `test/` | Adición o mejora de pruebas. | `test/sale-validation` |
| `ci/` | Cambios en los flujos de integración o despliegue. | `ci/frontend-build` |
| `chore/` | Mantenimiento técnico que no encaja mejor en otro prefijo. | `chore/update-dependencies` |

Opcionalmente, incluye el identificador de la tarea: `feature/123-register-sale`.

Las ramas de trabajo se crean normalmente desde `develop` y se integran a esa rama mediante un pull request. Los cambios listos para producción se integran de `develop` a `main`. Para una corrección urgente de producción, crea la rama `hotfix/` desde `main`, intégrala a `main` y asegúrate de incorporar también la corrección en `develop`.
