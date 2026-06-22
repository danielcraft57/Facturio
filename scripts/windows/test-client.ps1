<#
.SYNOPSIS
  Teste l'API publique PrestaFacture : clients (CRUD).

.DESCRIPTION
  GET /public → création → détail → liste → mise à jour.
  Jeton : -Token ou FACTURIO_API_TOKEN.
  Scopes : clients.read, clients.write

.PARAMETER SkipDelete
  Ne pas supprimer le client créé (défaut).

.EXAMPLE
  $env:FACTURIO_API_TOKEN = "fact_xxxx"
  .\scripts\windows\test-client.ps1

.EXAMPLE
  .\scripts\windows\test-client.ps1 -ClientId 5

.EXAMPLE
  .\scripts\windows\test-client.ps1 -Cleanup
#>
param(
	[string]$BaseUrl = "http://localhost:3000/api",
	[string]$Token = $env:FACTURIO_API_TOKEN,
	[int]$ClientId = 0,
	[string]$ClientEmail = "",
	[switch]$Cleanup
)

$ErrorActionPreference = "Stop"

if (-not $Token) {
	Write-Host "Jeton manquant. Définissez FACTURIO_API_TOKEN ou -Token fact_..." -ForegroundColor Red
	exit 1
}

if (-not $ClientEmail) {
	$ClientEmail = "client-api+{0}@example.com" -f ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
}

$headers = @{
	Authorization = "Bearer $Token"
}

function Get-ErrorBody($err) {
	if ($err.ErrorDetails.Message) {
		try { return $err.ErrorDetails.Message | ConvertFrom-Json } catch { return $null }
	}
	return $null
}

function Invoke-FacturioJson {
	param(
		[string]$Method,
		[string]$Uri,
		$Body = $null
	)
	$params = @{
		Uri         = $Uri
		Method      = $Method
		Headers     = $headers
		ContentType = "application/json; charset=utf-8"
	}
	if ($null -ne $Body) {
		$params.Body = ($Body | ConvertTo-Json -Depth 10 -Compress)
	}
	return Invoke-RestMethod @params
}

function Get-ClientList {
	$listRes = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/clients?page=1&pageSize=100"
	if ($listRes.clients) { return @($listRes.clients) }
	if ($listRes.items) { return @($listRes.items) }
	return @()
}

Write-Host ""
Write-Host "=== Test API clients ===" -ForegroundColor Cyan
Write-Host "Base: $BaseUrl"
Write-Host ""

try {
	$info = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public"
	Write-Host "GET /public OK — ressources: $($info.resources -join ', ')" -ForegroundColor Green
} catch {
	Write-Host "GET /public échoué: $($_.Exception.Message)" -ForegroundColor Red
	exit 1
}

$created = $false
$id = $ClientId

if ($id -le 0) {
	Write-Host "POST /public/clients ..." -ForegroundColor Yellow
	try {
		$client = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/clients" -Body @{
			name        = "Client script API"
			email       = $ClientEmail
			isCompany   = $true
			companyName = "Client script API SARL"
			countryCode = "FR"
		}
		$id = [int]$client.id
		$created = $true
		Write-Host "  créé id=$id email=$ClientEmail" -ForegroundColor Green
	} catch {
		$body = Get-ErrorBody $_
		if ($body.statusCode -eq 403) {
			Write-Host "  clients.write manquant — premier client existant (clients.read) ..." -ForegroundColor Yellow
			$all = Get-ClientList
			$pick = $all | Select-Object -First 1
			if (-not $pick) {
				Write-Host "Aucun client. Ajoutez clients.write au jeton." -ForegroundColor Red
				exit 1
			}
			$id = [int]$pick.id
			if ($pick.email) { $ClientEmail = "$($pick.email)" }
			Write-Host "  réutilisé id=$id" -ForegroundColor Green
		} else {
			throw
		}
	}
} else {
	Write-Host "Client imposé id=$id" -ForegroundColor Gray
}

Write-Host "GET /public/clients/$id ..." -ForegroundColor Yellow
$detail = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/clients/$id"
Write-Host "  name=$($detail.name) email=$($detail.email)" -ForegroundColor Green

Write-Host "GET /public/clients?search=script ..." -ForegroundColor Yellow
$list = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/clients?page=1&pageSize=20&search=script"
$total = if ($null -ne $list.total) { $list.total } else { (Get-ClientList).Count }
Write-Host "  résultats (total indicatif): $total" -ForegroundColor Green

if ($created) {
	$newName = "Client script API (maj)"
	Write-Host "PATCH /public/clients/$id ..." -ForegroundColor Yellow
	$updated = Invoke-FacturioJson -Method PATCH -Uri "$BaseUrl/public/clients/$id" -Body @{
		name = $newName
	}
	Write-Host "  name=$($updated.name)" -ForegroundColor Green
}

if ($Cleanup -and $created) {
	Write-Host "DELETE /public/clients/$id ..." -ForegroundColor Yellow
	try {
		$null = Invoke-FacturioJson -Method DELETE -Uri "$BaseUrl/public/clients/$id"
		Write-Host "  supprimé" -ForegroundColor Green
	} catch {
		Write-Host "  DELETE échoué: $($_.Exception.Message)" -ForegroundColor Yellow
	}
}

Write-Host ""
Write-Host "Terminé. Vérifiez la liste Clients dans PrestaFacture." -ForegroundColor Cyan
if ($created -and -not $Cleanup) {
	Write-Host "  Astuce : .\scripts\windows\test-client.ps1 -ClientId $id -Cleanup pour supprimer le client de test." -ForegroundColor Gray
}
Write-Host ""
