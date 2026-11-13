FROM cloudflare/cloudflared:2026.10.1@sha256:a15a3b50b8dabd57ac2090e9484c0247dba9dfa1f0df4d298d4317f9d69eb2d5 AS tunnel

FROM nocodb/nocodb:2026.09.1

COPY --from=tunnel /usr/local/bin/cloudflared /usr/local/bin/cloudflared
COPY nocodb/start.sh /usr/src/appEntry/mokart.sh
COPY nocodb/bootstrap.js /usr/src/appEntry/bootstrap.js
RUN chmod +x /usr/src/appEntry/mokart.sh

CMD ["/usr/src/appEntry/mokart.sh"]
