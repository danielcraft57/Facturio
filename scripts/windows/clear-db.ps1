param(
	[string]$Mode = "dev",
	[switch]$Seed
)

$ErrorActionPreference = "Stop"

if ($Mode -notin "dev", "prod") {
	Write-Host "Mode inconnu: $Mode (utiliser 'dev' ou 'prod')."
	exit 1
}

function Get-RepoRoot {
	return (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

function Parse-DatabaseUrl([string]$databaseUrl) {
	try {
		$uri = [System.Uri]$databaseUrl
		$dbName = $uri.AbsolutePath.TrimStart("/")
		return @{
			Host     = $uri.Host
			Database = $dbName
		}
	} catch {
		return @{
			Host     = "inconnu"
			Database = "inconnue"
		}
	}
}

$repoRoot = Get-RepoRoot
$serverDir = Join-Path $repoRoot "server"
$sqlFile = Join-Path $repoRoot "scripts\clear-db\sql\postgres-truncate-all.sql"

if ($Mode -eq "dev") {
	Write-Host ""
	Write-Host "Clear DB (DEV - SQLite)"
	Write-Host "Repo: $repoRoot"
	Write-Host "Server: $serverDir"
	Write-Host ""

	$devDbPath = Join-Path $serverDir "prisma\prisma\dev.db"
	if (Test-Path $devDbPath) {
		try {
			$stream = [System.IO.File]::Open($devDbPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
			$stream.Close()
		} catch {
			Write-Host "ERREUR: dev.db est utilise par un autre processus (le backend?)." -ForegroundColor Red
			Write-Host "Arrete le backend (Ctrl+C dans son terminal), puis relance ce script." -ForegroundColor Yellow
			exit 1
		}
	}

	Write-Host "Fichier DB qui sera supprime: $devDbPath"
	Write-Host "(Le backend doit utiliser ce meme chemin au demarrage - verifie le log 'Fichier DB (absolu)')."
	Write-Host ""

	$dbFiles = @(
		"prisma\dev.db",
		"prisma\dev.db-journal",
		"prisma\test.db",
		"prisma\test.db-journal",
		"prisma\prisma\dev.db",
		"prisma\prisma\dev.db-journal",
		"prisma\prisma\test.db",
		"prisma\prisma\test.db-journal",
		# Sécurité : au cas où Prisma a été lancé depuis server\prisma
		# avec DATABASE_URL=file:./prisma/prisma/dev.db, ce qui crée
		# un fichier supplémentaire dans prisma\prisma\prisma\*.db.
		"prisma\prisma\prisma\dev.db",
		"prisma\prisma\prisma\dev.db-journal",
		"prisma\prisma\prisma\test.db",
		"prisma\prisma\prisma\test.db-journal"
	)

	foreach ($f in $dbFiles) {
		$p = Join-Path $serverDir $f
		if (Test-Path $p) {
			Remove-Item -Force $p -ErrorAction SilentlyContinue
		}
	}

	Push-Location $serverDir
	try {
		$env:NODE_ENV = "dev"
		$env:DATABASE_URL = "file:./prisma/prisma/dev.db"

		Write-Host ""
		Write-Host "Recreation du schema Prisma (db push)..."
		npx prisma db push --schema=prisma/schema.prisma

		if ($Seed) {
			Write-Host ""
			Write-Host "Seed..."
			$env:SEED_PURGE = "true"
			npm run seed
		}

		Write-Host ""
		Write-Host "OK."
		Write-Host ""
		Write-Host "Important: si le backend tourne deja, arrete-le (Ctrl+C) puis relance-le pour qu'il utilise la nouvelle base."
	} finally {
		Pop-Location
	}

	exit 0
}

if ($Mode -eq "prod") {
	if (-not $env:DATABASE_URL) {
		Write-Host "DATABASE_URL manquant. Configure-le avant de lancer ce script."
		exit 1
	}

	if ($env:DATABASE_URL.StartsWith("file:")) {
		Write-Host "DATABASE_URL ressemble a du SQLite (file:...). Le mode prod attend une URL Postgres."
		exit 1
	}

	if (-not (Test-Path $sqlFile)) {
		Write-Host "Fichier SQL introuvable: $sqlFile"
		exit 1
	}

	$info = Parse-DatabaseUrl $env:DATABASE_URL
	$host = $info.Host
	$dbName = $info.Database

	Write-Host ""
	Write-Host "Clear DB (PROD - PostgreSQL)"
	Write-Host "ATTENTION: ca purge toutes les tables du schema public (sauf _prisma_migrations)."
	Write-Host "Cible: $dbName sur $host"
	Write-Host ""

	$phrase = "OUI EFFACER $dbName SUR $host"
	$confirm = Read-Host "Tape exactement: $phrase"
	if ($confirm -ne $phrase) {
		Write-Host "Annulé."
		exit 1
	}

	Push-Location $serverDir
	try {
		$env:NODE_ENV = "prod"

		Write-Host ""
		Write-Host "Purge Postgres (TRUNCATE)..."
		npx prisma db execute --schema=prisma/schema.postgresql.prisma --file="$sqlFile"

		if ($Seed) {
			Write-Host ""
			Write-Host "Seed prod..."
			npm run seed:prod
		}

		Write-Host ""
		Write-Host "OK."
	} finally {
		Pop-Location
	}

	exit 0
}

Write-Host "Mode inconnu: $Mode (utiliser 'dev' ou 'prod')."
exit 1

