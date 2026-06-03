$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Description,

        [Parameter(Mandatory = $true)]
        [scriptblock] $Command
    )

    Write-Host ""
    Write-Host "==> $Description"
    & $Command

    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $Description"
    }
}

function Find-WindowsExecutable {
    param(
        [Parameter(Mandatory = $true)]
        [string] $DistPath
    )

    $preferredBinary = Get-ChildItem -LiteralPath $DistPath -Recurse -File -Filter "clock-rhythm-win_x64*.exe" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if ($null -ne $preferredBinary) {
        return $preferredBinary
    }

    return Get-ChildItem -LiteralPath $DistPath -Recurse -File -Filter "*.exe" |
        Where-Object { $_.Name -like "*win_x64*.exe" } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

function Get-DesktopPath {
    $KnownDesktopPath = [Environment]::GetFolderPath([Environment+SpecialFolder]::Desktop)

    if (-not [string]::IsNullOrWhiteSpace($KnownDesktopPath)) {
        return $KnownDesktopPath
    }

    return Join-Path $env:USERPROFILE "Desktop"
}

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DistPath = Join-Path $ProjectRoot "dist"
$ReleaseDir = Join-Path $ProjectRoot "release\Clock Rhythm"
$ReleaseExecutable = Join-Path $ReleaseDir "Clock Rhythm.exe"
$DownloadDir = Join-Path $ProjectRoot "download"
$DownloadExecutable = Join-Path $DownloadDir "Clock Rhythm.exe"
$DesktopDir = Get-DesktopPath
$DesktopExecutable = Join-Path $DesktopDir "Clock Rhythm.exe"

Push-Location $ProjectRoot

try {
    Invoke-CheckedCommand "Run tests" { npm run test }
    Invoke-CheckedCommand "Run typecheck" { npm run typecheck }
    Invoke-CheckedCommand "Run lint" { npm run lint }
    Invoke-CheckedCommand "Run dependency boundary check" { npm run deps }
    Invoke-CheckedCommand "Build frontend" { npm run build }
    Invoke-CheckedCommand "Build embedded Windows executable" { npx --no-install neu build --release --embed-resources --clean }

    if (-not (Test-Path -LiteralPath $DistPath)) {
        throw "dist directory was not created."
    }

    $WindowsExecutable = Find-WindowsExecutable -DistPath $DistPath

    if ($null -eq $WindowsExecutable) {
        throw "Windows executable was not found under dist."
    }

    if ($WindowsExecutable.Length -le 0) {
        throw "Windows executable is empty: $($WindowsExecutable.FullName)"
    }

    New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null
    Copy-Item -LiteralPath $WindowsExecutable.FullName -Destination $ReleaseExecutable -Force
    New-Item -ItemType Directory -Path $DownloadDir -Force | Out-Null
    Copy-Item -LiteralPath $ReleaseExecutable -Destination $DownloadExecutable -Force

    if (-not (Test-Path -LiteralPath $DesktopDir)) {
        throw "Desktop directory was not found: $DesktopDir"
    }

    Copy-Item -LiteralPath $ReleaseExecutable -Destination $DesktopExecutable -Force

    $ReleaseFile = Get-Item -LiteralPath $ReleaseExecutable
    $DownloadFile = Get-Item -LiteralPath $DownloadExecutable
    $DesktopFile = Get-Item -LiteralPath $DesktopExecutable

    if ($ReleaseFile.Length -le 0 -or $DownloadFile.Length -le 0 -or $DesktopFile.Length -le 0) {
        throw "Copied executable is empty."
    }

    Write-Host ""
    Write-Host "Packaged executable:"
    Write-Host "  $($ReleaseFile.FullName)"
    Write-Host "Repository download executable:"
    Write-Host "  $($DownloadFile.FullName)"
    Write-Host "Copied to desktop:"
    Write-Host "  $($DesktopFile.FullName)"
}
finally {
    Pop-Location
}
