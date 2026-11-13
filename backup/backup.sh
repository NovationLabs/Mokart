#!/bin/sh
set -eu

: "${PGHOST:?}" "${PGUSER:?}" "${PGPASSWORD:?}"
: "${S3_ENDPOINT:?}" "${S3_BUCKET:?}" "${AWS_ACCESS_KEY_ID:?}" "${AWS_SECRET_ACCESS_KEY:?}"

DATABASES="${BACKUP_DATABASES:-${PGDATABASE:?}}"
PREFIX="${BACKUP_PREFIX:-${RAILWAY_ENVIRONMENT_NAME:-local}}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
CUTOFF=$(date -u -d "@$(( $(date +%s) - RETENTION_DAYS * 86400 ))" +%Y%m%dT%H%M%SZ)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

s3() {
  aws s3 "$@" --endpoint-url "$S3_ENDPOINT" --only-show-errors
}

s3_list() {
  aws s3 ls "s3://$S3_BUCKET/$PREFIX/$1/" --endpoint-url "$S3_ENDPOINT" > "$TMP/list"
}

for DB in $DATABASES; do
  FILE="$TMP/$DB-$STAMP.dump"
  pg_dump --format=custom --no-owner --no-privileges --dbname="$DB" --file="$FILE"
  pg_restore --list "$FILE" > /dev/null
  s3 cp "$FILE" "s3://$S3_BUCKET/$PREFIX/$DB/$DB-$STAMP.dump"
  echo "Mokart: $DB saved to $PREFIX/$DB/$DB-$STAMP.dump ($(wc -c < "$FILE") bytes)"
  rm -f "$FILE"

  [ "$RETENTION_DAYS" -gt 0 ] || continue
  s3_list "$DB"
  awk -v db="$DB" -v cutoff="$CUTOFF" '{
    name = $4; stamp = name
    sub("^" db "-", "", stamp); sub(/\.dump$/, "", stamp)
    if (stamp ~ /^[0-9]{8}T[0-9]{6}Z$/ && stamp < cutoff) print name
  }' "$TMP/list" > "$TMP/expired"
  while read -r OLD; do
    s3 rm "s3://$S3_BUCKET/$PREFIX/$DB/$OLD"
    echo "Mokart: $OLD removed"
  done < "$TMP/expired"
done
