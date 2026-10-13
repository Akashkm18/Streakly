# Streakly PostgreSQL Restore Script (PowerShell)
param (
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [switch]$Docker
)

if (-not (Test-Path $BackupFile)) {
  Write-Host "❌ Error: Backup file not found: $BackupFile" -ForegroundColor Red
  exit 1
}

Write-Host "⚠️ Restoring Streakly database from: $BackupFile" -ForegroundColor Yellow
$Confirmation = Read-Host "Are you sure you want to restore and overwrite the database? (y/N)"
if ($Confirmation -notmatch "^[yY]$") {
  Write-Host "Restore cancelled."
  exit 0
}

if ($Docker -or (docker ps -q -f name=streakly-postgres)) {
  Get-Content $BackupFile | docker exec -i streakly-postgres psql -U postgres streakly
} else {
  $DbUrl = if ($env:DATABASE_URL) { $env:DATABASE_URL } else { "postgresql://postgres:postgrespassword@localhost:5432/streakly" }
  Get-Content $BackupFile | & psql $DbUrl
}

Write-Host "✅ Database restored successfully from $BackupFile" -ForegroundColor Green
