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

if [ -n "${CF_TUNNEL_TOKEN:-}" ]; then
  /usr/local/bin/cloudflared tunnel --no-autoupdate run --token "$CF_TUNNEL_TOKEN" &
  TUNNEL_PID=$!
  trap 'kill "$NC_PID" "$TUNNEL_PID" 2> /dev/null || true' TERM INT
  while kill -0 "$NC_PID" 2> /dev/null && kill -0 "$TUNNEL_PID" 2> /dev/null; do
    sleep 5
  done
  echo "Mokart: NocoDB or Cloudflare Tunnel stopped" >&2
  kill "$NC_PID" "$TUNNEL_PID" 2> /dev/null || true
  wait "$NC_PID" 2> /dev/null || true
  wait "$TUNNEL_PID" 2> /dev/null || true
  exit 1
fi

wait "$NC_PID"
