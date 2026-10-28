# Installs the standalone `openspec.exe` (no Node.js needed) on Windows.
#
#   irm https://raw.githubusercontent.com/ayumuwall/OpenSpec-J/ja-docs/scripts/binary/install.ps1 | iex
#
# $env:OPENSPEC_VERSION      release to install (default: the newest complete one), e.g. v1.15.0
# $env:OPENSPEC_INSTALL_DIR  where to put it (default: %LOCALAPPDATA%\Programs\openspec)
# $env:OPENSPEC_INSTALL_NAME file name to install as (default: openspec.exe)
# $env:OPENSPEC_RELEASES_URL releases page to install from (default: GitHub's; mirrors, testing)
# $env:OPENSPEC_DOWNLOAD_URL one folder holding the release files (mirrors, testing)
#
# Runs in Windows PowerShell 5.1 and PowerShell 7. It throws instead of
# calling exit, which would close the window of anyone who piped it into iex.
& {
  $ErrorActionPreference = 'Stop'
  # Windows PowerShell 5.1 may default to TLS 1.0, which GitHub refuses, and
  # draws a progress bar that slows downloads many times over.
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
  $ProgressPreference = 'SilentlyContinue'

  # The OS architecture, not this PowerShell's: an x64 shell on an ARM PC
  # should still get the native ARM build.
  $arch = switch ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture) {
    'X64' { 'x64' }
    'Arm64' { 'arm64' }
    default { throw "openspec install: 未対応の CPU です: $_。代わりに npm で導入してください: npm install -g @ayumuwall/openspec" }
  }
  $asset = "openspec-windows-$arch.exe"

  $version = if ($env:OPENSPEC_VERSION) { $env:OPENSPEC_VERSION } else { 'latest' }
  if ($version -ne 'latest' -and -not $version.StartsWith('v')) { $version = "v$version" }
  # The binary and SHA256SUMS come from the same place, so a remote plain HTTP
  # source could swap both: only https, or http to this machine. [Uri] parses
  # the host, so http://localhost:80@evil.example/ is evil.example, not loopback.
  function Assert-Source($label, $value) {
    $uri = $null
    if (-not [Uri]::TryCreate($value, 'Absolute', [ref]$uri) -or $uri.UserInfo -or
        -not ($uri.Scheme -eq 'https' -or ($uri.Scheme -eq 'http' -and $uri.IsLoopback))) {
      throw "openspec install: $label は https（localhost は http も可）を使用してください: $value"
    }
  }
  $releases = if ($env:OPENSPEC_RELEASES_URL) { $env:OPENSPEC_RELEASES_URL.TrimEnd('/') } else { 'https://github.com/ayumuwall/OpenSpec-J/releases' }
  Assert-Source 'OPENSPEC_RELEASES_URL' $releases
  if ($env:OPENSPEC_DOWNLOAD_URL) { Assert-Source 'OPENSPEC_DOWNLOAD_URL' $env:OPENSPEC_DOWNLOAD_URL }
  $npmHint = 'または npm で導入してください（Node.js 20.19 以降）: npm install -g @ayumuwall/openspec'
  $dir = if ($env:OPENSPEC_INSTALL_DIR) { $env:OPENSPEC_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA 'Programs\openspec' }
  # Absolute, so the user PATH entry works from any directory.
  $dir = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($dir)
  $name = if ($env:OPENSPEC_INSTALL_NAME) { $env:OPENSPEC_INSTALL_NAME } else { 'openspec.exe' }

  # Staged inside the install dir so the final move is a same-volume rename.
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  # Copies set aside by an earlier upgrade, once nothing runs them any more.
  Get-ChildItem -Path $dir -Filter "$name.old-*" -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue
  $tmp = Join-Path $dir ('.openspec-install-' + [Guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $tmp | Out-Null
  try {
    $exe = Join-Path $tmp $asset
    $sums = Join-Path $tmp 'SHA256SUMS'
    if ($env:OPENSPEC_DOWNLOAD_URL) {
      $base = $env:OPENSPEC_DOWNLOAD_URL.TrimEnd('/')
    } elseif ($version -ne 'latest') {
      $base = "$releases/download/$version"
    } else {
      # The newest stable release whose files are all attached. GitHub calls a
      # release "latest" the moment it is published, minutes before the
      # Binaries workflow attaches the files (and for good, if that fails), so
      # "latest" is not trusted. SHA256SUMS is uploaded last: a release that
      # has it is complete.
      $feed = ''
      try { $feed = (Invoke-WebRequest -UseBasicParsing -Uri "$releases.atom").Content } catch { Write-Verbose "リリースフィードがありません: $_" }
      $tags = @([regex]::Matches($feed, '/releases/tag/(v\d+\.\d+\.\d+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)
      foreach ($tag in $tags) {
        try {
          Invoke-WebRequest -UseBasicParsing -Uri "$releases/download/$tag/SHA256SUMS" -OutFile $sums
          $version = $tag
          break
        } catch {
          Write-Verbose "$tag の準備が完了していません: $_"
        }
      }
      if ($version -eq 'latest') { throw "openspec install: $releases に単体実行ファイルが揃ったリリースがありません。$npmHint" }
      if ($tags.Count -gt 0 -and $version -ne $tags[0]) { Write-Host "$($tags[0]) は準備中のため、$version をインストールします。" }
      $base = "$releases/download/$version"
    }

    Write-Host "$asset ($version) をダウンロード中..."
    try {
      Invoke-WebRequest -UseBasicParsing -Uri "$base/$asset" -OutFile $exe
      if (-not (Test-Path $sums)) { Invoke-WebRequest -UseBasicParsing -Uri "$base/SHA256SUMS" -OutFile $sums }
    } catch {
      throw "openspec install: ${base} からダウンロードできませんでした: $($_.Exception.Message)。$npmHint"
    }

    $line = Get-Content $sums | Where-Object { ($_ -split '\s+')[1] -eq $asset } | Select-Object -First 1
    if (-not $line) { throw "openspec install: $asset が SHA256SUMS にありません" }
    $expected = ($line -split '\s+')[0]
    $actual = (Get-FileHash -Algorithm SHA256 -Path $exe).Hash
    if ($actual -ne $expected) { throw "openspec install: $asset のチェックサムが一致しないため、インストールを中止します" }

    $installed = $null
    # A binary that cannot start at all throws instead of setting an exit code.
    try { $installed = & $exe --version } catch { Write-Verbose "openspec --version が失敗しました: $_" }
    if ($LASTEXITCODE -ne 0 -or -not $installed) {
      throw "openspec install: ダウンロードした $asset はこの環境で動作しません（Windows 10 以降が必要です）"
    }

    $target = Join-Path $dir $name
    # Windows cannot overwrite a running exe, and `openspec install` runs this
    # from the very exe it replaces. Renaming a running exe is allowed, so the
    # old copy moves aside: deleted now, or by the next install if still running.
    $old = $null
    if (Test-Path $target) {
      $old = "$target.old-" + [Guid]::NewGuid().ToString('N')
      Rename-Item -Path $target -NewName (Split-Path $old -Leaf)
    }
    try {
      Move-Item -Path $exe -Destination $target
    } catch {
      if ($old) { Rename-Item -Path $old -NewName $name -ErrorAction SilentlyContinue }
      throw "openspec install: ${target} へインストールできませんでした: $($_.Exception.Message)"
    }
    if ($old) { Remove-Item -Force -Path $old -ErrorAction SilentlyContinue }
    # Clear any "downloaded from the internet" mark so Windows does not block it.
    Unblock-File -Path $target -ErrorAction SilentlyContinue
    Write-Host "openspec をインストールしました: $installed → $target"
  } finally {
    Remove-Item -Recurse -Force -Path $tmp -ErrorAction SilentlyContinue
  }

  # Unlike a shell profile, the user PATH is the standard place for this on
  # Windows. Only appended to, and only when missing. Read and written raw:
  # [Environment]::SetEnvironmentVariable would save it expanded, turning
  # entries like %USERPROFILE%\bin into fixed paths for good.
  $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
  try {
    $raw = [string]$key.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
    $entries = @($raw -split ';' | Where-Object { $_ })
    if ($entries -notcontains $dir) {
      $key.SetValue('Path', (($entries + $dir) -join ';'), [Microsoft.Win32.RegistryValueKind]::ExpandString)
      # Setting any user variable broadcasts the change, so new terminals see it.
      [Environment]::SetEnvironmentVariable('OPENSPEC_INSTALL_PATH_CHANGED', '1', 'User')
      [Environment]::SetEnvironmentVariable('OPENSPEC_INSTALL_PATH_CHANGED', $null, 'User')
      $env:Path = "$env:Path;$dir"
      Write-Host "ユーザー PATH に $dir を追加しました。どの場所でも openspec を使えるよう、ターミナルを開き直してください。"
    }
  } finally {
    $key.Close()
  }
}
