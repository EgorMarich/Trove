#!/usr/bin/env sh
set -eu

: "${BACKUP_FILE:?BACKUP_FILE is required}"
command -v pg_restore >/dev/null 2>&1 || { echo "pg_restore is required" >&2; exit 1; }
[ -f "$BACKUP_FILE" ] || { echo "Backup file not found: $BACKUP_FILE" >&2; exit 1; }

pg_restore --list "$BACKUP_FILE" >/dev/null
echo "Backup archive is readable: $BACKUP_FILE"
