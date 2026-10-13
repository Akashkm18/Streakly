#!/bin/bash
set -e

# Streakly PostgreSQL Backup Script
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/streakly_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "📦 Creating Streakly database backup..."

if [ "$1" == "--docker" ] || docker ps | grep -q "streakly-postgres"; then
  docker exec -t streakly-postgres pg_dump -U postgres streakly > "$FILENAME"
else
  # Local pg_dump using DATABASE_URL if available
  DB_URL=${DATABASE_URL:-"postgresql://postgres:postgrespassword@localhost:5432/streakly"}
  pg_dump "$DB_URL" > "$FILENAME"
fi

echo "✅ Backup successfully created at: $FILENAME"
echo "Backup size: $(du -h "$FILENAME" | cut -f1)"
