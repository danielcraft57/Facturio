<#
.SYNOPSIS
  Teste l'API publique PrestaFacture : produits (CRUD).

.DESCRIPTION
  GET /public → création → détail → liste → mise à jour.
  Jeton : -Token ou FACTURIO_API_TOKEN.
  Scopes : produits.read, produits.write

.PARAMETER ProductId
  Tester un produit existant (sans création).

.EXAMPLE
  $env:FACTURIO_API_TOKEN = "fact_xxxx"
  .\scripts\windows\test-produit.ps1

.EXAMPLE
  .\scripts\windows\test-produit.ps1 -ProductId 12 -Cleanup
#>
param(
	[string]$BaseUrl = "http://localhost:3000/api",
	[string]$Token = $env:FACTURIO_API_TOKEN,
	[int]$ProductId = 0,
	[switch]$Cleanup
)

$ErrorActionPreference = "Stop"

if (-not $Token) {
	Write-Host "Jeton manquant. Définissez FACTURIO_API_TOKEN ou -Token fact_..." -ForegroundColor Red
	exit 1
}

$sku = "API-TEST-{0}" -f ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())

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

function Get-ProductList {
	$listRes = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/produits?page=1&pageSize=100"
	if ($listRes.products) { return @($listRes.products) }
	if ($listRes.items) { return @($listRes.items) }
	if ($listRes.data) { return @($listRes.data) }
	return @()
}

Write-Host ""
Write-Host "=== Test API produits ===" -ForegroundColor Cyan
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
$id = $ProductId

if ($id -le 0) {
	Write-Host "POST /public/produits ..." -ForegroundColor Yellow
	try {
		$product = Invoke-FacturioJson -Method POST -Uri "$BaseUrl/public/produits" -Body @{
			name      = "Produit test script API"
			sku       = $sku
			kind      = "SERVICE"
			unitPrice = 199.5
			purpose   = "Test intégration API"
			techStack = @{ languages = @("TypeScript"); frontend = @("React") }
			livrables = @(
				@{ livrable = "Recette fonctionnelle"; montant = 120; heures = 2 },
				@{ livrable = "Documentation"; montant = 79.5; heures = 1 }
			)
		}
		$id = [int]$product.id
		$created = $true
		Write-Host "  créé id=$id sku=$sku unitPrice=$($product.unitPrice)" -ForegroundColor Green
	} catch {
		$body = Get-ErrorBody $_
		if ($body.statusCode -eq 403) {
			Write-Host "  produits.write manquant — premier produit existant (produits.read) ..." -ForegroundColor Yellow
			$all = Get-ProductList
			$pick = $all | Select-Object -First 1
			if (-not $pick) {
				Write-Host "Aucun produit. Ajoutez produits.write au jeton." -ForegroundColor Red
				exit 1
			}
			$id = [int]$pick.id
			Write-Host "  réutilisé id=$id name=$($pick.name)" -ForegroundColor Green
		} else {
			throw
		}
	}
} else {
	Write-Host "Produit imposé id=$id" -ForegroundColor Gray
}

Write-Host "GET /public/produits/$id ..." -ForegroundColor Yellow
$detail = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/produits/$id"
Write-Host "  name=$($detail.name) sku=$($detail.sku) unitPrice=$($detail.unitPrice)" -ForegroundColor Green

Write-Host "GET /public/produits?search=test ..." -ForegroundColor Yellow
$list = Invoke-FacturioJson -Method GET -Uri "$BaseUrl/public/produits?page=1&pageSize=20&search=test"
$total = if ($null -ne $list.total) { $list.total } else { (Get-ProductList).Count }
Write-Host "  résultats (total indicatif): $total" -ForegroundColor Green

if ($created) {
	Write-Host "PATCH /public/produits/$id ..." -ForegroundColor Yellow
	$updated = Invoke-FacturioJson -Method PATCH -Uri "$BaseUrl/public/produits/$id" -Body @{
		unitPrice = 249.99
		purpose   = "Test API — prix mis à jour"
	}
	Write-Host "  unitPrice=$($updated.unitPrice)" -ForegroundColor Green
}

if ($Cleanup -and $created) {
	Write-Host "DELETE /public/produits/$id ..." -ForegroundColor Yellow
	try {
		$null = Invoke-FacturioJson -Method DELETE -Uri "$BaseUrl/public/produits/$id"
		Write-Host "  supprimé" -ForegroundColor Green
	} catch {
		Write-Host "  DELETE échoué: $($_.Exception.Message)" -ForegroundColor Yellow
	}
}

Write-Host ""
Write-Host "Terminé. Vérifiez le catalogue Produits dans PrestaFacture." -ForegroundColor Cyan
if ($created -and -not $Cleanup) {
	Write-Host "  Astuce : .\scripts\windows\test-produit.ps1 -ProductId $id -Cleanup pour supprimer le produit de test." -ForegroundColor Gray
}
Write-Host ""
