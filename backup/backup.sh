#!/bin/sh
set -eu
set -o pipefail

: "${PGHOST:?}" "${PGUSER:?}" "${PGPASSWORD:?}"
: "${S3_ENDPOINT:?}" "${S3_BUCKET:?}" "${AWS_ACCESS_KEY_ID:?}" "${AWS_SECRET_ACCESS_KEY:?}"

DATABASES="${BACKUP_DATABASES:-${PGDATABASE:?}}"
PREFIX="${BACKUP_PREFIX:-${RAILWAY_ENVIRONMENT_NAME:-local}}"
KEEP_COUNT="${BACKUP_KEEP_COUNT:-2}"
case "$KEEP_COUNT" in
  ''|*[!0-9]*) echo "Mokart: BACKUP_KEEP_COUNT must be a positive integer" >&2; exit 1 ;;
esac
[ "$KEEP_COUNT" -gt 0 ] || { echo "Mokart: BACKUP_KEEP_COUNT must be at least 1" >&2; exit 1; }

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

s3() {
  aws s3 "$@" --endpoint-url "$S3_ENDPOINT" --only-show-errors
}

s3_list() {
  aws s3 ls "s3://$S3_BUCKET/$PREFIX/$1/" --endpoint-url "$S3_ENDPOINT" > "$TMP/list"
  awk '{print $4}' "$TMP/list" | while IFS= read -r name; do
    case "$name" in
      "$1"-????????T??????Z.dump) printf '%s\n' "$name" ;;
    esac
  done | sort > "$TMP/names"
}

logical_hash() {
  # pg_restore embeds a random SQL restriction key unless we fix it.
  # Its non-verbose SQL output omits the archive creation timestamp.
  pg_restore --no-owner --no-privileges --restrict-key=0 --file=- "$1" \
    | sha256sum | cut -d ' ' -f 1
}

for DB in $DATABASES; do
  FILE="$TMP/$DB-$STAMP.dump"
  pg_dump --format=custom --no-owner --no-privileges --dbname="$DB" --file="$FILE"
  pg_restore --list "$FILE" > /dev/null
  HASH=$(logical_hash "$FILE")

  s3_list "$DB"
  LATEST=$(tail -n 1 "$TMP/names")
  PREVIOUS_HASH=""
  if [ -n "$LATEST" ]; then
    KEY="$PREFIX/$DB/$LATEST"
    PREVIOUS_HASH=$(aws s3api head-object --bucket "$S3_BUCKET" --key "$KEY" \
      --query 'Metadata.sha256' --output text --endpoint-url "$S3_ENDPOINT")
    if [ "$PREVIOUS_HASH" = "None" ]; then
      # Existing backups predate the digest metadata; compare them once here.
      s3 cp "s3://$S3_BUCKET/$KEY" "$TMP/previous.dump"
      PREVIOUS_HASH=$(logical_hash "$TMP/previous.dump")
      rm -f "$TMP/previous.dump"
    fi
  fi

  if [ "$HASH" = "$PREVIOUS_HASH" ]; then
    echo "Mokart: $DB unchanged; keeping $LATEST"
  else
    s3 cp "$FILE" "s3://$S3_BUCKET/$PREFIX/$DB/$DB-$STAMP.dump" \
      --metadata "sha256=$HASH"
    echo "Mokart: $DB saved to $PREFIX/$DB/$DB-$STAMP.dump ($(wc -c < "$FILE") bytes)"
  fi
  rm -f "$FILE"

  s3_list "$DB"
  COUNT=$(wc -l < "$TMP/names")
  if [ "$COUNT" -gt "$KEEP_COUNT" ]; then
    head -n "$((COUNT - KEEP_COUNT))" "$TMP/names" > "$TMP/expired"
    while IFS= read -r OLD; do
      s3 rm "s3://$S3_BUCKET/$PREFIX/$DB/$OLD"
      echo "Mokart: $OLD removed"
    done < "$TMP/expired"
  fi
done
