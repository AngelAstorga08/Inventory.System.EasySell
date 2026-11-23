# Inventory.System.Backend

## Acceso a PostgreSQL

Infrastructure usa directamente el paquete `Npgsql`. Configura la cadena de conexión antes de iniciar la API mediante la variable de entorno `ConnectionStrings__InventoryDatabase`, por ejemplo:

```powershell
$env:ConnectionStrings__InventoryDatabase = "Host=localhost;Port=5432;Database=inventory_system;Username=postgres;Password=<tu-contraseña>"
dotnet run --project .\Inventory.System.Api
```

Los repositorios de Infrastructure invocarán funciones PostgreSQL con parámetros Npgsql y mapearán explícitamente sus resultados. Las funciones de escritura deben preservar las operaciones atómicas de cada caso de uso; si un caso requiere más de una llamada, el repositorio coordinará las llamadas dentro de una transacción Npgsql.
