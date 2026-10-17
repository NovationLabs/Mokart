#!/bin/sh

/usr/src/appEntry/start.sh &
NC_PID=$!

URL="http://127.0.0.1:${PORT:-8080}"

until curl -sf "$URL/api/v1/health" > /dev/null; do
  kill -0 "$NC_PID" 2> /dev/null || exit 1
  sleep 2
done

TOKEN=$(node -e '
fetch(process.argv[1] + "/api/v1/auth/user/signin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: process.env.NC_ADMIN_EMAIL, password: process.env.NC_ADMIN_PASSWORD })
}).then(r => r.json()).then(d => console.log(d.token || "")).catch(() => console.log(""))
' "$URL")

if [ -n "$TOKEN" ] && curl -sf -X POST "$URL/api/v1/app-settings" \
  -H "Content-Type: application/json" -H "xc-auth: $TOKEN" \
  -d '{"invite_only_signup":true,"restrict_workspace_creation":true}' > /dev/null; then
  echo "Mokart: NocoDB signup restricted to invitations"
else
  echo "Mokart: unable to restrict NocoDB signup" >&2
fi

wait "$NC_PID"
