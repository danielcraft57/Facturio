param([string]$RegionName, [string[]]$Tlds, [string]$OutPath)

function Test-Libre($d) {
  $out = whois -accepteula $d 2>&1 | Out-String
  if ($out -match 'Domain not found\.|%% NOT FOUND|is available for registration|No match for|>>> Domain .+ is available|Status:\s*free|NOT REGISTERED|No Object Found') {
    if ($out -match 'Creation Date:|Registry Expiry Date:|Registry Domain ID:|Registrar Registration Expiration|Registered on:|paid-till:') { return 'PRIS' }
    return 'LIBRE'
  }
  if ($out -match 'Creation Date:|Registry Expiry Date:|Registry Domain ID:|Registrar Registration Expiration|Registered on:|paid-till:|nserver:\s+\S') { return 'PRIS' }
  if ($out -match 'Domain not found|NOT FOUND|available for registration|No match') { return 'LIBRE' }
  return 'INCONNU'
}

$stems = @(
  'devismart','smartdevis','mobildevis','devismobil','webdevis','devisweb',
  'smartfactu','factusmart','mobilfactu','clientdevis','devisclient','clientfact',
  'webfactu','factuweb','smartclient','mobilclient','devishub','factuhub','clienthub',
  'devisnet','factunet','clientnet','smartbill','webbill','codefactu','factucode',
  'cloudfactu','factucloud','appdevis','devisapp','getdevis','trydevis','mydevis',
  'factubox','boxdevis','pulsefactu','factupulse','craftdevis','deviscraft',
  'fluxdevis','devisflux','infodevis','devisinfo','webclient','clientweb',
  'mobilbill','devbill','stackdevis','devisstack','nexdevis','devisnex',
  'smartfact','factsmart','billclient','clientbill','metafactu','factumeta'
)

$libre = @(); $pris = @(); $inconnu = @()
$i = 0; $total = $stems.Count * $Tlds.Count
foreach ($stem in $stems) {
  foreach ($tld in $Tlds) {
    $i++; $d = "$stem$tld"
    switch (Test-Libre $d) {
      'LIBRE' { $libre += $d }
      'PRIS'  { $pris += $d }
      default { $inconnu += $d }
    }
    if ($i % 40 -eq 0) { Write-Host "[$RegionName] $i/$total libre=$($libre.Count)" }
  }
}
@{ Region = $RegionName; LIBRE = $libre; PRIS = $pris; INCONNU = $inconnu } | ConvertTo-Json -Depth 3 | Set-Content $OutPath -Encoding utf8
Write-Host "DONE $RegionName LIBRE=$($libre.Count) -> $OutPath"
