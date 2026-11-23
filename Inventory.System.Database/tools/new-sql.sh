#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
DATABASE_ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)
KIND=
NAME=
OPERATION=
AUTHOR=
AUTHOR_SET=false
POSITIONAL=()

usage() {
  echo 'Usage: ./new-sql.sh [migration|function] [NAME] [--operation create|alter|delete|insert] [--author NAME] [--database-dir PATH]'
}
fail() { echo "Error: $*" >&2; exit 1; }
choose() {
  local prompt=$1 answer index
  shift
  local choices=("$@")
  echo "$prompt" >&2
  for index in "${!choices[@]}"; do echo "  $((index + 1)). ${choices[index]}" >&2; done
  while true; do
    read -r -p '> ' answer || return 1
    for index in "${!choices[@]}"; do
      if [[ "$answer" == "${choices[index]}" || "$answer" == "$((index + 1))" ]]; then
        printf '%s' "${choices[index]}"; return
      fi
    done
    echo 'Choose a listed name or number.' >&2
  done
}

while (($#)); do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --operation|--author|--database-dir)
      (($# >= 2)) || fail "Missing value for $1."
      case "$1" in
        --operation) OPERATION=$2 ;;
        --author) AUTHOR=$2; AUTHOR_SET=true ;;
        --database-dir) DATABASE_ROOT=$2 ;;
      esac
      shift 2 ;;
    --*) fail "Unknown argument: $1" ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done
((${#POSITIONAL[@]} <= 2)) || fail 'Too many positional arguments. Quote names containing spaces.'
KIND=${POSITIONAL[0]:-}
NAME=${POSITIONAL[1]:-}
[[ -n "$KIND" ]] || KIND=$(choose 'File type:' migration function) || fail 'Input cancelled.'
case "$KIND" in migration|function) ;; *) fail 'File type must be migration or function.' ;; esac
if [[ "$KIND" == migration ]]; then
  [[ -n "$OPERATION" ]] || OPERATION=$(choose 'Migration operation:' create alter delete insert) || fail 'Input cancelled.'
  case "$OPERATION" in create|alter|delete|insert) ;; *) fail 'Invalid migration operation.' ;; esac
else
  [[ -z "$OPERATION" ]] || fail '--operation applies only to migrations.'
fi
if [[ -z "$NAME" ]]; then read -r -p 'Description / function name: ' NAME || fail 'Input cancelled.'; fi
DATABASE_ROOT=$(cd -- "$DATABASE_ROOT" && pwd)
[[ -f "$DATABASE_ROOT/flyway.toml" ]] || fail 'Database directory must contain flyway.toml.'

# Normalize common Spanish accents without requiring an external language runtime.
NORMALIZED=$NAME
FROM=(á é í ó ú ü ñ Á É Í Ó Ú Ü Ñ)
TO=(a e i o u u n A E I O U U N)
for index in "${!FROM[@]}"; do NORMALIZED=${NORMALIZED//${FROM[index]}/${TO[index]}}; done
SLUG=$(printf '%s' "$NORMALIZED" | LC_ALL=C tr '[:upper:]' '[:lower:]' | LC_ALL=C sed -E 's/[^a-z0-9]+/_/g; s/^_+//; s/_+$//')
[[ -n "$SLUG" ]] || fail 'The name must contain at least one ASCII letter or digit.'
if [[ "$AUTHOR_SET" == false ]]; then AUTHOR=$(git -C "$DATABASE_ROOT" config user.name 2>/dev/null || true); fi
AUTHOR=$(printf '%s' "$AUTHOR" | tr '\r\n\t' '   ' | sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//')
[[ -n "$AUTHOR" ]] || fail 'Configure git config user.name or pass --author.'
CREATED_AT=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
if [[ "$KIND" == migration ]]; then
  TIMESTAMP=$(date -u '+%Y%m%d%H%M%S%6N')
  [[ "$TIMESTAMP" =~ ^[0-9]+$ ]] || TIMESTAMP=$(date -u '+%Y%m%d%H%M%S')
  FOLDER=migrations
  FILENAME="V${TIMESTAMP}__${OPERATION}_${SLUG}.sql"
else
  FOLDER=functions
  FILENAME="R__${SLUG}.sql"
fi
mkdir -p -- "$DATABASE_ROOT/$FOLDER"
DESTINATION="$DATABASE_ROOT/$FOLDER/$FILENAME"
RELATIVE_PATH="$(basename -- "$DATABASE_ROOT")/$FOLDER/$FILENAME"
# noclobber refuses to overwrite an existing file, including concurrent creates.
if ! (set -o noclobber; printf '%s\n' "-- Path: $RELATIVE_PATH" "-- Author: $AUTHOR" "-- Created at: $CREATED_AT" '' > "$DESTINATION"); then
  fail "Cannot create file (existing files are never overwritten): $DESTINATION"
fi
echo "$DESTINATION"
echo 'File created. Complete the SQL before running migrate.'
