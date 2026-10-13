# Streakly PostgreSQL Backup Script (PowerShell)
param (
  [switch]$Docker
)

$BackupDir = Join-Path $PSScriptRoot "..\backups"
if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "streakly_backup_$Timestamp.sql"

Write-Host "📦 Creating Streakly database backup..." -ForegroundColor Cyan

if ($Docker -or (docker ps -q -f name=streakly-postgres)) {
  docker exec -t streakly-postgres pg_dump -U postgres streakly | Out-File -FilePath $BackupFile -Encoding utf8
} else {
  $DbUrl = if ($env:DATABASE_URL) { $env:DATABASE_URL } else { "postgresql://postgres:postgrespassword@localhost:5432/streakly" }
  & pg_dump $DbUrl | Out-File -FilePath $BackupFile -Encoding utf8
}

if (Test-Path $BackupFile) {
  $Size = (Get-Item $BackupFile).Length / 1KB
  Write-Host "✅ Backup created successfully at: $BackupFile ($([math]::Round($Size, 2)) KB)" -ForegroundColor Green
} else {
  Write-Host "❌ Backup failed." -ForegroundColor Red
}
