param(
  [Parameter(Mandatory = $true)][string]$MinecraftJar,
  [Parameter(Mandatory = $true)][string]$Ae2Jar,
  [Parameter(Mandatory = $true)][string]$CreateJar,
  [string]$MinecraftAssetsRoot
)
$ErrorActionPreference = 'Stop'
$resourceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../src/data/mc/resources'))
$prefix = $resourceRoot + [IO.Path]::DirectorySeparatorChar
$files = [ordered]@{}
$sources = @(
  @{ id = 'minecraft'; version = '1.21.1'; archive = $MinecraftJar },
  @{ id = 'create'; version = '6.0.10'; archive = $CreateJar },
  @{ id = 'ae2'; version = '19.2.17'; archive = $Ae2Jar }
)
$sourceManifest = @()
foreach ($source in $sources) {
  $archivePath = (Resolve-Path -LiteralPath $source.archive).Path
  $zip = [IO.Compression.ZipFile]::OpenRead($archivePath)
  $count = 0
  try {
    foreach ($entry in $zip.Entries | Sort-Object FullName) {
      if ($entry.FullName -notmatch '^assets/[^/]+/((blockstates|models)/.+\.json|textures/.+\.(png|mcmeta)|lang/(en_us|zh_cn)\.json)$') { continue }
      $target = [IO.Path]::GetFullPath((Join-Path $resourceRoot $entry.FullName))
      if (-not $target.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { throw "Archive path escapes resource root: $($entry.FullName)" }
      [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
      $stream = $entry.Open()
      $memory = [IO.MemoryStream]::new()
      try { $stream.CopyTo($memory); $bytes = $memory.ToArray() } finally { $stream.Dispose(); $memory.Dispose() }
      $digest = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
      if (-not [IO.File]::Exists($target) -or (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() -ne $digest) {
        [IO.File]::WriteAllBytes($target, $bytes)
      }
      $files[$entry.FullName] = @{ source = $source.id; sha256 = $digest }
      $count++
    }
  } finally { $zip.Dispose() }
  $sourceManifest += @{ id = $source.id; version = $source.version; sha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant(); files = $count }
  Write-Output "$($source.id) $($source.version): $count files"
}
if ($MinecraftAssetsRoot) {
  $index = Get-Content -LiteralPath (Join-Path $MinecraftAssetsRoot 'indexes/17.json') -Raw | ConvertFrom-Json
  $hash = $index.objects.'minecraft/lang/zh_cn.json'.hash
  if (-not $hash) { throw 'Minecraft asset index 17 has no zh_cn language file' }
  $inputPath = Join-Path $MinecraftAssetsRoot "objects/$($hash.Substring(0,2))/$hash"
  if ((Get-FileHash -LiteralPath $inputPath -Algorithm SHA1).Hash.ToLowerInvariant() -ne $hash) { throw 'Minecraft language asset checksum mismatch' }
  $relative = 'assets/minecraft/lang/zh_cn.json'
  $target = Join-Path $resourceRoot $relative
  Copy-Item -LiteralPath $inputPath -Destination $target -Force
  $files[$relative] = @{ source = 'minecraft'; sha256 = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() }
}
$manifest = @{ schema = 1; minecraft = '1.21.1'; sources = $sourceManifest; files = $files }
$json = $manifest | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText((Join-Path $resourceRoot 'manifest.json'), $json + "`n", [Text.UTF8Encoding]::new($false))
Write-Output "Manifest: $($files.Count) files"
