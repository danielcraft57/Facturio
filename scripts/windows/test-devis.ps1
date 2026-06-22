<#
.SYNOPSIS
  Teste l'API publique PrestaFacture : devis, envoi email, acceptation ou refus.

.DESCRIPTION
  1. Réutilise un client existant (-ClientId) ou le crée (clients.write).
     Sans clients.write : liste les clients (clients.read) et prend le premier avec email.
  2. Crée un devis → envoi → accept/refus (token public).

  Jeton : -Token ou FACTURIO_API_TOKEN.
  Scopes minimum : devis.read, devis.write, devis.send
  (+ clients.read OU clients.write, ou -ClientId)

.PARAMETER Action
  SendOnly | Accept | Reject | Full (défaut Full = envoi puis acceptation)

.EXAMPLE
  $env:FACTURIO_API_TOKEN = "fact_xxxx"
  .\scripts\windows\test-devis.ps1

.EXAMPLE
  .\scripts\windows\test-devis.ps1 -ClientId 3

.EXAMPLE
  .\scripts\windows\test-devis.ps1 -Action Reject
#>
param(
	[string]$BaseUrl = "http://localhost:3000/api",
	[string]$Token = $env:FACTURIO_API_TOKEN,
	[string]$ClientId = "",
	[string]$ClientEmail = "",
	[ValidateSet("SendOnly", "Accept", "Reject", "Full")]
	[string]$Action = "Full",
	[string]$PublicToken = ""
)

$ErrorActionPreference = "Stop"

if (-not $Token) {
	Write-Host "Jeton manquant. Définissez FACTURIO_API_TOKEN ou -Token fact_..." -ForegroundColor Red
	exit 1
}

if (-not $ClientEmail) {
	$ClientEmail = "devis-api+{0}@example.com" -f ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
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
		$Body = $null,
		[switch]$NoAuth
	)
	$params = @{
		Uri         = $Uri
		Method      = $Method
		ContentType = "application/json; charset=utf-8"
	}
	if (-not $NoAuth) {
		$params.Headers = $headers
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

function Resolve-ClientId {
	if ($script:ClientId -gt 0) {
		Write-Host "Client imposé id=$($script:ClientId)" -ForegroundColor Gray
		try {
			$c = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/clients/$($script:ClientId)"
			if ($c.email) { $script:ClientEmail = $c.email }
			if (-not $c.email) {
				Write-Host "  Attention : ce client n'a pas d'email — emailSent sera false." -ForegroundColor Yellow
			}
		} catch {
			Write-Host "  (clients.read absent — on utilise l'id sans vérification)" -ForegroundColor DarkYellow
		}
		return $script:ClientId
	}

	Write-Host "POST /public/clients ..." -ForegroundColor Yellow
	try {
		$client = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/clients" -Body @{
			name        = "Client devis API"
			email       = $script:ClientEmail
			countryCode = "FR"
		}
		Write-Host "  client créé id=$($client.id) email=$($script:ClientEmail)" -ForegroundColor Green
		return "$($client.id)"
	} catch {
		$body = Get-ErrorBody $_
		if ($body.statusCode -ne 403) { throw }

		Write-Host "  clients.write manquant — recherche d'un client existant (clients.read) ..." -ForegroundColor Yellow
		try {
			$all = Get-ClientList
		} catch {
			Write-Host ""
			Write-Host "Impossible de créer ou lister un client." -ForegroundColor Red
			Write-Host "  • Ajoutez clients.write au jeton, ou clients.read + un client avec email, ou" -ForegroundColor Red
			Write-Host "  • Lancez : .\scripts\windows\test-devis.ps1 -ClientId <id>" -ForegroundColor Red
			Write-Host ""
			exit 1
		}

		$withEmail = $all | Where-Object { $_.email -and "$($_.email)".Trim() }
		$pick = $withEmail | Where-Object { "$($_.email)" -eq $script:ClientEmail } | Select-Object -First 1
		if (-not $pick) {
			$pick = $withEmail | Select-Object -First 1
		}
		if (-not $pick) {
			Write-Host "Aucun client avec email dans l'organisation. Créez-en un dans PrestaFacture ou ajoutez clients.write." -ForegroundColor Red
			exit 1
		}

		$script:ClientEmail = "$($pick.email)"
		Write-Host "  client réutilisé id=$($pick.id) email=$($script:ClientEmail)" -ForegroundColor Green
		return "$($pick.id)"
	}
}

Write-Host ""
Write-Host "=== Test API devis ($Action) ===" -ForegroundColor Cyan
Write-Host "Base: $BaseUrl"
Write-Host ""

try {
	$null = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public"
	Write-Host "GET /public OK" -ForegroundColor Green
} catch {
	Write-Host "GET /public échoué: $($_.Exception.Message)" -ForegroundColor Red
	exit 1
}

$ClientId = Resolve-ClientId

$expiry = (Get-Date).AddMonths(2).ToString("yyyy-MM-dd")
Write-Host "POST /public/devis ..." -ForegroundColor Yellow
$quote = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/devis" -Body @{
	clientId   = $ClientId
	expiryDate = $expiry
	lines      = @(
		@{
			description = "Développement test script"
			quantity    = 1
			unitPrice   = 2500
			taxRate     = 0.2
		}
	)
}
Write-Host "  id=$($quote.id) number=$($quote.number) status=$($quote.status)" -ForegroundColor Green

Write-Host "POST /public/devis/$($quote.id)/send ..." -ForegroundColor Yellow
$sendRes = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/devis/$($quote.id)/send"
$token = $sendRes.publicToken
if (-not $token -and $PublicToken) { $token = $PublicToken }

Write-Host "  status=$($sendRes.status) emailSent=$($sendRes.emailSent) publicToken=$token" -ForegroundColor Green
if (-not $sendRes.emailSent) {
	Write-Host "  emailSent=false — vérifiez l'email sur le client id=$ClientId" -ForegroundColor Yellow
}
if ($sendRes.publicUrl) {
	Write-Host "  publicUrl=$($sendRes.publicUrl)" -ForegroundColor Gray
}

if (-not $token) {
	Write-Host "Pas de publicToken — impossible d'accepter/refuser." -ForegroundColor Red
	exit 1
}

if ($Action -eq "SendOnly") {
	Write-Host ""
	Write-Host "Envoi seul. Liens client (front) :" -ForegroundColor Cyan
	Write-Host "  Accepter : http://localhost:5173/public/devis/$token/accepter"
	Write-Host "  Refuser  : http://localhost:5173/public/devis/$token/refuser"
	Write-Host "API accept : POST $BaseUrl/public/quotes/$token/accept"
	Write-Host ""
	exit 0
}

if ($Action -eq "Accept" -or $Action -eq "Full") {
	Write-Host "POST /public/quotes/$token/accept ..." -ForegroundColor Yellow
	try {
		$acceptRes = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/quotes/$token/accept" -NoAuth
		Write-Host "  status=$($acceptRes.status) invoiceId=$($acceptRes.invoiceId) invoiceNumber=$($acceptRes.invoiceNumber)" -ForegroundColor Green
	} catch {
		Write-Host "  Accept échoué: $($_.Exception.Message)" -ForegroundColor Red
		if ($Action -eq "Full") { exit 1 }
	}
}

if ($Action -eq "Reject") {
	Write-Host "POST /public/quotes/$token/reject ..." -ForegroundColor Yellow
	$rejectRes = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/quotes/$token/reject" -NoAuth
	Write-Host "  ok=$($rejectRes.ok)" -ForegroundColor Green
}

if ($Action -eq "Full") {
	Write-Host "GET /public/devis/$($quote.id) (statut final) ..." -ForegroundColor Yellow
	$final = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/devis/$($quote.id)"
	Write-Host "  status=$($final.status)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Terminé. Vérifiez Devis / Factures et le centre d'activité dans PrestaFacture." -ForegroundColor Cyan
Write-Host ""
