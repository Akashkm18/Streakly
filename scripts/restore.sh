#!/bin/bash
set -e

# Streakly PostgreSQL Restore Script
if [ -z "$1" ]; then
  echo "❌ Error: Backup file path required."
  echo "Usage: ./scripts/restore.sh <path_to_backup_file.sql> [--docker]"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: File not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️ Restoring Streakly database from: $BACKUP_FILE"
read -p "Are you sure you want to overwrite existing database data? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Restoration aborted."
  exit 0
fi

if [ "$2" == "--docker" ] || docker ps | grep -q "streakly-postgres"; then
  cat "$BACKUP_FILE" | docker exec -i streakly-postgres psql -U postgres streakly
else
  DB_URL=${DATABASE_URL:-"postgresql://postgres:postgrespassword@localhost:5432/streakly"}
  psql "$DB_URL" < "$BACKUP_FILE"
fi

echo "✅ Database restored successfully from $BACKUP_FILE"
