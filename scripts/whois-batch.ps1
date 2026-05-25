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

$regions = [ordered]@{
  Europe    = @('.fr','.de','.eu','.it','.es','.pt','.nl','.be','.ch','.at','.pl','.se','.uk','.ie','.fi','.dk','.no','.cz','.ro','.hu','.gr')
  Asie      = @('.jp','.cn','.kr','.in','.sg','.hk','.tw','.th','.id','.my','.vn','.ph')
  Oceanie   = @('.au','.nz')
  Afrique   = @('.za','.ng','.ke','.ma','.tn','.sn','.ci','.eg','.gh')
  Ameriques = @('.br','.mx','.ar','.co','.cl','.pe')
  Generique = @('.io','.cloud','.tech','.online','.site','.space','.world','.digital','.store')
}

$outFile = Join-Path $PSScriptRoot 'whois-batch-results.json'
$all = @{}

foreach ($rName in $regions.Keys) {
  $libre = [System.Collections.Generic.List[string]]::new()
  $pris = [System.Collections.Generic.List[string]]::new()
  $inconnu = [System.Collections.Generic.List[string]]::new()
  $i = 0
  $total = $stems.Count * $regions[$rName].Count
  foreach ($stem in $stems) {
    foreach ($tld in $regions[$rName]) {
      $i++
      $d = "$stem$tld"
      $s = Test-Libre $d
      switch ($s) {
        'LIBRE' { $libre.Add($d) }
        'PRIS'  { $pris.Add($d) }
        default { $inconnu.Add($d) }
      }
      if ($i % 50 -eq 0) { Write-Host "[$rName] $i / $total" }
    }
  }
  $all[$rName] = @{ LIBRE = $libre; PRIS = $pris; INCONNU = $inconnu }
  Write-Host "== $rName : LIBRE=$($libre.Count) PRIS=$($pris.Count) INCONNU=$($inconnu.Count) =="
}

$all | ConvertTo-Json -Depth 4 | Set-Content $outFile -Encoding utf8
Write-Host "Saved: $outFile"
