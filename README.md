# Inventory System

## Ejecución local

Ejecuta cada bloque desde la raíz del repositorio. En Windows, usa Git Bash para Flyway y PowerShell para la API y el frontend.

### Requisitos

- PostgreSQL en ejecución y Flyway CLI disponible en el PATH.
- SDK de .NET 10 para la API.
- Node.js y pnpm para el frontend. El flujo de CI usa Node.js 26.5.0 y pnpm 11.20.0.

### 1. Preparar PostgreSQL

Crea una base de datos local llamada `inventory_system`. Copia la plantilla de configuración y edita `Inventory.System.Database/flyway.user.toml` con tu usuario y contraseña de PostgreSQL.

```bash
cp -n Inventory.System.Database/flyway.user.toml.example Inventory.System.Database/flyway.user.toml
```

Si PostgreSQL usa otro host o puerto, ajusta la URL del entorno `local` en `Inventory.System.Database/flyway.toml`. Aplica las migraciones con Git Bash.

```bash
bash Inventory.System.Database/tools/flyway.sh migrate --environment local
```

### 2. Iniciar la API

En una terminal de PowerShell, usa los mismos datos de conexión que configuraste para Flyway.

```powershell
$env:ConnectionStrings__InventoryDatabase = 'Host=localhost;Port=5432;Database=inventory_system;Username=postgres;Password=<tu-contraseña>'
dotnet run --project .\Inventory.System.Backend\Inventory.System.Api --launch-profile http
```

El documento OpenAPI queda disponible en [http://localhost:5298/openapi/v1.json](http://localhost:5298/openapi/v1.json).

### 3. Iniciar el frontend

En otra terminal de PowerShell, ejecuta:

```powershell
Set-Location .\Inventory.System.Frontend
pnpm install --frozen-lockfile
pnpm dev
```

Abre la URL que imprima Vite, normalmente [http://localhost:5173](http://localhost:5173). El frontend usa datos simulados y se puede ejecutar por separado.

## Documentación

- [Flujo de trabajo con Git y convención de ramas](docs/git-workflow.md)
- [Documentación del proyecto](docs/project-documentation.md)
- [Scripts y configuración de Flyway](Inventory.System.Database/README.md)
