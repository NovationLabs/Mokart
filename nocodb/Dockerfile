FROM nocodb/nocodb:2026.09.1

COPY nocodb/start.sh /usr/src/appEntry/mokart.sh
COPY nocodb/bootstrap.js /usr/src/appEntry/bootstrap.js
RUN chmod +x /usr/src/appEntry/mokart.sh

CMD ["/usr/src/appEntry/mokart.sh"]
