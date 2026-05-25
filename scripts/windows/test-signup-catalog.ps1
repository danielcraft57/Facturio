<#
.SYNOPSIS
  Test manuel : inscription avec stack tech + catalogue + produits aléatoires.

.EXAMPLE
  .\scripts\windows\test-signup-catalog.ps1

.EXAMPLE
  .\scripts\windows\test-signup-catalog.ps1 -BaseUrl http://localhost:3000/api -ProductCount 3
#>
param(
	[string]$BaseUrl = "http://localhost:3000/api",
	[int]$ProductCount = 5
)

$ErrorActionPreference = "Stop"

function Invoke-Api {
	param([string]$Method, [string]$Path, $Body = $null, $Headers = @{})
	$params = @{
		Method      = $Method
		Uri         = "$BaseUrl$Path"
		Headers     = $Headers
		ContentType = "application/json"
	}
	if ($null -ne $Body) {
		$params.Body = ($Body | ConvertTo-Json -Depth 6 -Compress)
	}
	return Invoke-RestMethod @params
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "signup-test+$stamp@example.com"
$password = "TestPass123!"
$orgName = "Dev Studio $stamp"

Write-Host "1. Choix tech-stack (public)..." -ForegroundColor Cyan
$choices = Invoke-Api -Method GET -Path "/catalog/tech-choices"
Write-Host "   $($choices.categories.Count) catégories"

$techIds = @("react", "typescript", "nestjs", "nodejs", "javascript")
Write-Host "2. Inscription ($email)..." -ForegroundColor Cyan
$signup = Invoke-Api -Method POST -Path "/auth/signup" -Body @{
	email            = $email
	password         = $password
	firstName        = "Test"
	lastName         = "Dev"
	organizationName = $orgName
	acceptTerms      = $true
	acceptPrivacy    = $true
	technologyIds    = $techIds
}
Write-Host "   $($signup.message)"

Write-Host "3. Activez le compte via le lien email, puis appuyez sur Entrée pour continuer..." -ForegroundColor Yellow
Read-Host | Out-Null

Write-Host "4. Connexion..." -ForegroundColor Cyan
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$loginRes = Invoke-WebRequest -Method POST -Uri "$BaseUrl/auth/login" -Body $loginBody -ContentType "application/json" -SessionVariable session
$auth = $loginRes.Content | ConvertFrom-Json
Write-Host "   Connecté : $($auth.user.email)"

Write-Host "5. Catalogue organisation..." -ForegroundColor Cyan
$catalog = Invoke-WebRequest -Method GET -Uri "$BaseUrl/catalog/organization" -WebSession $session
$cat = $catalog.Content | ConvertFrom-Json
Write-Host "   $($cat.productIds.Count) produits recommandés"

Write-Host "6. Création de $ProductCount produits aléatoires..." -ForegroundColor Cyan
$kinds = @("SERVICE", "APP", "SAAS", "GOOD")
$tags = @("JavaScript", "TypeScript", "React", "NestJS", "Node.js")
for ($i = 0; $i -lt $ProductCount; $i++) {
	$sku = "PS1-{0}-{1}" -f $stamp, $i
	$payload = @{
		name        = "Prestation aléatoire $sku"
		sku         = $sku
		kind        = $kinds[$i % $kinds.Count]
		unitPrice   = 49 + (Get-Random -Maximum 250)
		languages   = @($tags[(Get-Random -Maximum $tags.Count)])
		category    = "DEV"
		description = "Créé par test-signup-catalog.ps1"
	}
	$p = Invoke-WebRequest -Method POST -Uri "$BaseUrl/products" -Body ($payload | ConvertTo-Json) -ContentType "application/json" -WebSession $session
	$prod = $p.Content | ConvertFrom-Json
	Write-Host "   + $($prod.name) ($($prod.sku)) — $($prod.unitPrice) EUR"
}

$list = Invoke-WebRequest -Method GET -Uri "$BaseUrl/products?pageSize=50" -WebSession $session
$all = $list.Content | ConvertFrom-Json
Write-Host "`nOK — $($all.total) produits visibles au total." -ForegroundColor Green
