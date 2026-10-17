FROM postgres:15-alpine

RUN apk add --no-cache aws-cli

ENV AWS_DEFAULT_REGION=auto \
    AWS_REQUEST_CHECKSUM_CALCULATION=when_required \
    AWS_RESPONSE_CHECKSUM_VALIDATION=when_required

COPY backup/backup.sh /usr/local/bin/mokart-backup
COPY backup/restore.sh /usr/local/bin/mokart-restore
RUN chmod +x /usr/local/bin/mokart-backup /usr/local/bin/mokart-restore

CMD ["mokart-backup"]
