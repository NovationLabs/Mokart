#!/bin/sh

/usr/src/appEntry/start.sh &
NC_PID=$!

URL="http://127.0.0.1:${PORT:-8080}"

until curl -sf "$URL/api/v1/health" > /dev/null; do
  kill -0 "$NC_PID" 2> /dev/null || exit 1
  sleep 2
done

if ! node /usr/src/appEntry/bootstrap.js "$URL"; then
  echo "Mokart: NocoDB bootstrap failed" >&2
  kill "$NC_PID" 2> /dev/null || true
  wait "$NC_PID" 2> /dev/null || true
  exit 1
fi

wait "$NC_PID"
