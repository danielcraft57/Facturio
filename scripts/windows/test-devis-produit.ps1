<#
.SYNOPSIS
  Teste POST /public/devis avec productSku (get-or-create catalogue).

.DESCRIPTION
  1. Client (création ou réutilisation, comme test-devis.ps1).
  2. Devis ligne productSku inconnu → produit créé + ligne liée.
  3. Devis même SKU → même productId, prix catalogue si unitPrice omis.
  4. GET /public/produits?search=… pour vérifier le catalogue.
  5. POST /public/devis/:id/send (optionnel) — PDF + liens accepter / refuser.

  Jeton : -Token ou FACTURIO_API_TOKEN.
  Scopes : devis.write, devis.send pour l’envoi (+ clients.read ou clients.write, ou -ClientId)

.PARAMETER Action
  CreateOnly | SendOnly | Full (défaut Full = get-or-create puis envoi)

.EXAMPLE
  $env:FACTURIO_API_TOKEN = "fact_xxxx"
  .\scripts\windows\test-devis-produit.ps1

.EXAMPLE
  .\scripts\windows\test-devis-produit.ps1 -Action CreateOnly

.EXAMPLE
  .\scripts\windows\test-devis-produit.ps1 -ClientId "kl644kqh8r" -Sku "MON-SKU-TEST"
#>
param(
	[string]$BaseUrl = "http://localhost:3000/api",
	[string]$Token = $env:FACTURIO_API_TOKEN,
	[string]$ClientId = "",
	[string]$ClientEmail = "",
	[string]$Sku = "",
	[ValidateSet("CreateOnly", "SendOnly", "Full")]
	[string]$Action = "Full"
)

$ErrorActionPreference = "Stop"

if (-not $Token) {
	Write-Host "Jeton manquant. Définissez FACTURIO_API_TOKEN ou -Token fact_..." -ForegroundColor Red
	exit 1
}

if (-not $Sku) {
	$Sku = "DEVIS-SKU-{0}" -f ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
}

if (-not $ClientEmail) {
	$ClientEmail = "devis-sku+{0}@example.com" -f ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
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
	if ($script:ClientId -and "$($script:ClientId)".Trim()) {
		Write-Host "Client imposé id=$($script:ClientId)" -ForegroundColor Gray
		try {
			$c = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/clients/$($script:ClientId)"
			if ($c.email) { $script:ClientEmail = "$($c.email)" }
		} catch {
			Write-Host "  (clients.read absent — email non vérifié)" -ForegroundColor DarkYellow
		}
		return "$($script:ClientId)"
	}

	Write-Host "POST /public/clients ..." -ForegroundColor Yellow
	try {
		$client = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/clients" -Body @{
			name        = "Client devis SKU API"
			email       = $script:ClientEmail
			countryCode = "FR"
		}
		Write-Host "  client créé id=$($client.id)" -ForegroundColor Green
		return "$($client.id)"
	} catch {
		$body = Get-ErrorBody $_
		if ($body.statusCode -ne 403) { throw }

		Write-Host "  clients.write manquant — client existant (clients.read) ..." -ForegroundColor Yellow
		$all = Get-ClientList
		$pick = $all | Where-Object { $_.email -and "$($_.email)".Trim() } | Select-Object -First 1
		if (-not $pick) {
			Write-Host "Ajoutez clients.write ou -ClientId <id>." -ForegroundColor Red
			exit 1
		}
		Write-Host "  client réutilisé id=$($pick.id)" -ForegroundColor Green
		return "$($pick.id)"
	}
}

Write-Host ""
Write-Host "=== Test devis + productSku ($Action) ===" -ForegroundColor Cyan
Write-Host "Base: $BaseUrl"
Write-Host "SKU:  $Sku"
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

Write-Host "POST /public/devis (1er appel — création produit) ..." -ForegroundColor Yellow
$quote1 = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/devis" -Body @{
	clientId   = $ClientId
	expiryDate = $expiry
	lines      = @(
		@{
			productSku  = $Sku
			description = "Prestation test get-or-create SKU"
			quantity    = 1
			unitPrice   = 1750
			taxRate     = 0.2
		}
	)
}
$line1 = @($quote1.lines)[0]
if (-not $line1.productId) {
	Write-Host "  Échec : ligne sans productId après création" -ForegroundColor Red
	exit 1
}
$productId = [int]$line1.productId
Write-Host "  devis id=$($quote1.id) number=$($quote1.number) productId=$productId" -ForegroundColor Green

Write-Host "GET /public/produits/$productId ..." -ForegroundColor Yellow
$product = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/produits/$productId"
if ("$($product.sku)" -ne $Sku) {
	Write-Host "  SKU attendu $Sku, reçu $($product.sku)" -ForegroundColor Red
	exit 1
}
Write-Host "  produit sku=$($product.sku) name=$($product.name) unitPrice=$($product.unitPrice)" -ForegroundColor Green

Write-Host "POST /public/devis (2e appel — réutilisation SKU, sans unitPrice) ..." -ForegroundColor Yellow
$quote2 = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/devis" -Body @{
	clientId   = $ClientId
	expiryDate = $expiry
	lines      = @(
		@{
			productSku = $Sku
			quantity   = 2
			taxRate    = 0.2
		}
	)
}
$line2 = @($quote2.lines)[0]
if ([int]$line2.productId -ne $productId) {
	Write-Host "  productId différent : $($line2.productId) vs $productId" -ForegroundColor Red
	exit 1
}
Write-Host "  devis id=$($quote2.id) productId=$($line2.productId) unitPrice=$($line2.unitPrice)" -ForegroundColor Green

Write-Host "GET /public/produits?search=$Sku ..." -ForegroundColor Yellow
$search = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/produits?page=1&pageSize=20&search=$([uri]::EscapeDataString($Sku))"
$items = @()
if ($search.products) { $items = @($search.products) }
elseif ($search.items) { $items = @($search.items) }
$found = $items | Where-Object { "$($_.sku)" -eq $Sku } | Select-Object -First 1
if (-not $found) {
	Write-Host "  Produit non trouvé via search (vérifiez manuellement le catalogue)" -ForegroundColor Yellow
} else {
	Write-Host "  trouvé id=$($found.id)" -ForegroundColor Green
}

if ($Action -eq "CreateOnly") {
	Write-Host ""
	Write-Host "CreateOnly — pas d’envoi. Devis à envoyer : id=$($quote1.id)" -ForegroundColor Cyan
	Write-Host "  POST $BaseUrl/public/devis/$($quote1.id)/send" -ForegroundColor Gray
	Write-Host ""
	exit 0
}

Write-Host "POST /public/devis/$($quote1.id)/send ..." -ForegroundColor Yellow
$token = $null
try {
	$sendRes = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/devis/$($quote1.id)/send"
	$token = $sendRes.publicToken
	Write-Host "  status=$($sendRes.status) emailSent=$($sendRes.emailSent) publicToken=$token" -ForegroundColor Green
	if (-not $sendRes.emailSent) {
		Write-Host "  emailSent=false — le client id=$ClientId doit avoir un email valide" -ForegroundColor Yellow
	}
	if ($sendRes.publicUrl) {
		Write-Host "  publicUrl=$($sendRes.publicUrl)" -ForegroundColor Gray
	}
} catch {
	$body = Get-ErrorBody $_
	if ($body.statusCode -eq 403) {
		Write-Host "  devis.send manquant sur le jeton — ajoutez le scope dans Paramètres → API" -ForegroundColor Red
		exit 1
	}
	throw
}

if (-not $token) {
	Write-Host "Pas de publicToken — envoi incomplet." -ForegroundColor Red
	exit 1
}

if ($Action -eq "SendOnly") {
	Write-Host ""
	Write-Host "Envoi OK. Liens client :" -ForegroundColor Cyan
	Write-Host "  Accepter : http://localhost:5173/public/devis/$token/accepter"
	Write-Host "  Refuser  : http://localhost:5173/public/devis/$token/refuser"
	Write-Host ""
	exit 0
}

Write-Host "POST /public/quotes/$token/accept ..." -ForegroundColor Yellow
try {
	$acceptRes = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/quotes/$token/accept" -NoAuth
	Write-Host "  status=$($acceptRes.status) invoiceId=$($acceptRes.invoiceId) invoiceNumber=$($acceptRes.invoiceNumber)" -ForegroundColor Green
} catch {
	Write-Host "  Accept échoué: $($_.Exception.Message)" -ForegroundColor Red
	exit 1
}

Write-Host "GET /public/devis/$($quote1.id) (statut final) ..." -ForegroundColor Yellow
$final = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/devis/$($quote1.id)"
Write-Host "  status=$($final.status)" -ForegroundColor Green

Write-Host ""
Write-Host "Terminé. Devis envoyé + accepté ; vérifiez Factures et Catalogue produits." -ForegroundColor Cyan
Write-Host "  SKU test : $Sku | productId : $productId" -ForegroundColor Gray
Write-Host ""
