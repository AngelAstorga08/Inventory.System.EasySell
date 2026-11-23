#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
DATABASE_ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)
ENVIRONMENT=local
ACTION=

usage() {
  echo 'Usage: ./flyway.sh info|validate|migrate [--environment local] [--database-dir PATH]'
}
fail() { echo "Error: $*" >&2; exit 1; }

while (($#)); do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --environment|--database-dir)
      (($# >= 2)) || fail "Missing value for $1."
      if [[ "$1" == --environment ]]; then ENVIRONMENT=$2; else DATABASE_ROOT=$2; fi
      shift 2 ;;
    info|validate|migrate)
      [[ -z "$ACTION" ]] || fail 'Choose only one command.'
      ACTION=$1; shift ;;
    *) fail "Unknown argument: $1" ;;
  esac
done
[[ -n "$ACTION" ]] || { usage >&2; exit 1; }
[[ "$ENVIRONMENT" =~ ^[A-Za-z0-9_]+$ ]] || fail 'Invalid environment name.'
DATABASE_ROOT=$(cd -- "$DATABASE_ROOT" && pwd)
[[ -f "$DATABASE_ROOT/flyway.toml" ]] || fail 'Database directory must contain flyway.toml.'
case "${OSTYPE:-}" in
  msys*|cygwin*) EXECUTABLE=$(command -v flyway.cmd || command -v flyway || true) ;;
  *) EXECUTABLE=$(command -v flyway || true) ;;
esac
[[ -n "$EXECUTABLE" ]] || fail 'Flyway CLI was not found. Install it and add it to PATH.'
echo "Database project: $DATABASE_ROOT"
echo "Environment: $ENVIRONMENT | Command: $ACTION"
cd -- "$DATABASE_ROOT"
exec "$EXECUTABLE" "-workingDirectory=$DATABASE_ROOT" "-environment=$ENVIRONMENT" "$ACTION"
