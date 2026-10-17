#!/bin/sh
set -eu

: "${PGHOST:?}" "${PGUSER:?}" "${PGPASSWORD:?}"
: "${S3_ENDPOINT:?}" "${S3_BUCKET:?}" "${AWS_ACCESS_KEY_ID:?}" "${AWS_SECRET_ACCESS_KEY:?}"

DB="${1:?usage: mokart-restore <database> [dump-name]}"
PREFIX="${BACKUP_PREFIX:-${RAILWAY_ENVIRONMENT_NAME:-local}}"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

NAME="${2:-}"
if [ -z "$NAME" ]; then
  aws s3 ls "s3://$S3_BUCKET/$PREFIX/$DB/" --endpoint-url "$S3_ENDPOINT" > "$TMP/list"
  NAME=$(awk -v db="$DB" '$4 ~ "^" db "-[0-9]{8}T[0-9]{6}Z\\.dump$" {print $4}' "$TMP/list" | sort | tail -n 1)
fi
[ -n "$NAME" ] || { echo "Mokart: no backup found for $DB in $PREFIX" >&2; exit 1; }

aws s3 cp "s3://$S3_BUCKET/$PREFIX/$DB/$NAME" "$TMP/$NAME" --endpoint-url "$S3_ENDPOINT" --only-show-errors
pg_restore --list "$TMP/$NAME" > /dev/null
pg_restore --clean --if-exists --no-owner --no-privileges --single-transaction --dbname="$DB" "$TMP/$NAME"
echo "Mokart: $DB restored from $PREFIX/$DB/$NAME"
