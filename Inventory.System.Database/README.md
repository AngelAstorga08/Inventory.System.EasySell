# Inventory.System.Database

Scripts PostgreSQL, configuración Flyway y herramientas Bash para Linux y Git Bash en Windows. No requieren Python, Rust ni compilación.

## Configurar

Instala Flyway CLI y agrégalo al PATH. Revisa la URL de `flyway.toml`. Copia `flyway.user.toml.example` a `flyway.user.toml` y configura tus credenciales; este último está excluido de Git. Flyway lee los TOML. Los scripts no cargan `.env`.

Desde esta carpeta, habilita la ejecución si tu sistema lo requiere:

```bash
chmod +x tools/flyway.sh tools/new-sql.sh
```

## Ejecutar Flyway

Desde `Inventory.System.Database`, usando Bash:

```bash
./tools/flyway.sh info
./tools/flyway.sh validate
./tools/flyway.sh migrate --environment local
```

Desde la raíz del repositorio:

```bash
./Inventory.System.Database/tools/flyway.sh info
```

El wrapper calcula la raíz desde su propia ubicación, fija el directorio de trabajo y propaga el código de salida de Flyway. Funciona desde cualquier carpeta al indicar la ruta del script. En Windows úsalo desde Git Bash; PowerShell no ejecuta Bash de forma nativa.

## Generar SQL

Modo interactivo:

```bash
./tools/new-sql.sh
```

Modo directo:

```bash
./tools/new-sql.sh migration products --operation create
./tools/new-sql.sh migration product_description --operation alter
./tools/new-sql.sh migration obsolete_table --operation delete
./tools/new-sql.sh migration initial_roles --operation insert
./tools/new-sql.sh function get_products
```

Los archivos se generan en `migrations/V<timestamp_UTC>__<operation>_<name>.sql` o `functions/R__<name>.sql`, dentro de Inventory.System.Database. Solo contienen el encabezado `Path`, `Author` y `Created at`, en inglés, sin TODO ni ejemplos SQL. El cuerpo queda vacío para escribir el cambio. No se sobrescriben archivos existentes.

El autor se obtiene con `git config user.name`; puedes indicarlo con `--author "Name"`. Los nombres se convierten a minúsculas y guiones bajos; se normalizan los acentos habituales del español. No se traduce el nombre proporcionado. `delete` clasifica la eliminación de objetos mediante `DROP`; para borrar registros escribe `DELETE FROM ... WHERE ...` en el cuerpo.

Ambos scripts admiten `--database-dir PATH` para señalar otro proyecto que contenga `flyway.toml`. Usa `--help` para ver la sintaxis. El generador utiliza Bash y las herramientas habituales `date`, `tr`, `sed`, `mkdir`, `basename` y `dirname`, disponibles en Linux y Git Bash. Git solo es necesario para obtener el autor automáticamente.

## Versionado

Completa el SQL antes de ejecutar migrate. No modifiques migraciones versionadas ya aplicadas: crea una nueva. Para modificar una función repetible, edita su archivo existente conservando el encabezado. Cambios incompatibles de firma o retorno pueden requerir una migración explícita para gestionar dependencias.

Flyway aplica primero migraciones versionadas y después funciones repetibles nuevas o modificadas. Si una migración necesita una función antes, incluye la definición necesaria en esa migración o diseña una secuencia versionada explícita.
