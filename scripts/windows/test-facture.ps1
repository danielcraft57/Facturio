<#
.SYNOPSIS
  Teste l'API publique PrestaFacture : facture payée externe + envoi email.

.DESCRIPTION
  Équivalent des curl documentés (paidExternally + POST .../send).
  Jeton : paramètre -Token ou variable d'environnement FACTURIO_API_TOKEN.

.EXAMPLE
  $env:FACTURIO_API_TOKEN = "fact_xxxx"
  .\scripts\windows\test-facture.ps1

.EXAMPLE
  .\scripts\windows\test-facture.ps1 -Token "fact_xxxx" -ClientEmail "moi@test.fr"
#>
param(
	[string]$BaseUrl = "http://localhost:3000/api",
	[string]$Token = $env:FACTURIO_API_TOKEN,
	[string]$ClientEmail = "",
	[switch]$ClassicInvoice
)

$ErrorActionPreference = "Stop"

if (-not $Token) {
	Write-Host "Jeton manquant. Définissez FACTURIO_API_TOKEN ou -Token fact_..." -ForegroundColor Red
	exit 1
}

if (-not $ClientEmail) {
	$ClientEmail = "api-test+{0}@example.com" -f ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
}

$headers = @{
	Authorization = "Bearer $Token"
}

function Invoke-FacturioJson {
	param(
		[string]$Method,
		[string]$Uri,
		$Body = $null
	)
	$params = @{
		Uri             = $Uri
		Method          = $Method
		Headers         = $headers
		ContentType     = "application/json; charset=utf-8"
	}
	if ($null -ne $Body) {
		$params.Body = ($Body | ConvertTo-Json -Depth 10 -Compress)
	}
	return Invoke-RestMethod @params
}

Write-Host ""
Write-Host "=== Test API factures ===" -ForegroundColor Cyan
Write-Host "Base: $BaseUrl"
Write-Host "Email client: $ClientEmail"
Write-Host ""

try {
	$info = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public"
	Write-Host "GET /public OK — ressources: $($info.resources -join ', ')" -ForegroundColor Green
} catch {
	Write-Host "GET /public échoué: $($_.Exception.Message)" -ForegroundColor Red
	exit 1
}

if ($ClassicInvoice) {
	$body = @{
		clientEmail = $ClientEmail
		clientName  = "Client API test"
		lines       = @(
			@{
				description = "Prestation test"
				quantity    = 1
				unitPrice   = 149.99
				taxRate     = 0.2
			}
		)
	}
} else {
	$body = @{
		clientEmail            = $ClientEmail
		clientName             = "Client API test"
		paidExternally         = $true
		externalPaymentMethod  = "Script PowerShell"
		externalPaymentDate    = (Get-Date -Format "yyyy-MM-dd")
		currency               = "EUR"
		lines                  = @(
			@{
				description = "Commande test API"
				quantity    = 1
				unitPrice   = 99
				taxRate     = 0.2
			}
		)
	}
}

Write-Host "POST /public/factures ..." -ForegroundColor Yellow
$invoice = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/factures" -Body $body
Write-Host "  id=$($invoice.id) number=$($invoice.number) status=$($invoice.status) balance=$($invoice.balance)" -ForegroundColor Green

$sendBody = @{
	email              = $ClientEmail
	updateClientEmail  = $true
}

Write-Host "POST /public/factures/$($invoice.id)/send ..." -ForegroundColor Yellow
$sendRes = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/factures/$($invoice.id)/send" -Body $sendBody
Write-Host "  emailSent=$($sendRes.emailSent) alreadyPaid=$($sendRes.alreadyPaid) sentTo=$($sendRes.sentTo)" -ForegroundColor Green

Write-Host ""
Write-Host "Terminé. Vérifiez la liste Factures dans PrestaFacture (icône email verte si sentAt renseigné)." -ForegroundColor Cyan
Write-Host ""
