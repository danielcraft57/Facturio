<#
.SYNOPSIS
  Purge les données commerciales d'une organisation en local (clients, devis, factures).

.DESCRIPTION
  Wrapper vers server/scripts/purge-organization-commercial.js.
  Ne supprime pas toute la base (contrairement à clear-db.ps1) : conserve produits, compte, jetons API.

  Arrête le backend si la base SQLite est verrouillée.

.PARAMETER Target
  Email utilisateur ou org:ID (ex. daniel@danielcraft.fr, org:1)

.PARAMETER Command
  stats (défaut) ou purge

.PARAMETER Confirm
  Obligatoire pour exécuter la purge (sinon dry-run)

.EXAMPLE
  .\scripts\windows\purge-commercial.ps1 -Target daniel@danielcraft.fr

.EXAMPLE
  .\scripts\windows\purge-commercial.ps1 -Target daniel@danielcraft.fr -Command purge -Confirm
#>
param(
	[Parameter(Mandatory = $true)]
	[string]$Target,
	[ValidateSet("stats", "purge")]
	[string]$Command = "stats",
	[switch]$Confirm
)

$ErrorActionPreference = "Stop"

function Get-RepoRoot {
	return (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

$repoRoot = Get-RepoRoot
$serverDir = Join-Path $repoRoot "server"
$devDbPath = Join-Path $serverDir "prisma\prisma\dev.db"

if (Test-Path $devDbPath) {
	try {
		$stream = [System.IO.File]::Open($devDbPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
		$stream.Close()
	} catch {
		Write-Host "ERREUR: dev.db est utilisé par un autre processus (backend ?)." -ForegroundColor Red
		Write-Host "Arrête le backend, puis relance ce script." -ForegroundColor Yellow
		exit 1
	}
}

$nodeArgs = @("scripts/purge-organization-commercial.js", $Command, $Target)
if ($Confirm) {
	$nodeArgs += "--confirm"
}

Write-Host ""
Write-Host "Purge commerciale — $Command — $Target"
Write-Host "Server: $serverDir"
Write-Host ""

Push-Location $serverDir
try {
	& node @nodeArgs
	exit $LASTEXITCODE
} finally {
	Pop-Location
}
