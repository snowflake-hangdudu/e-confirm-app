# Android build environment setup for Expo / EAS local builds (Windows user scope).
$ErrorActionPreference = "Stop"

$jdkRoot = Join-Path $env:USERPROFILE ".gradle\jdks"
$javaHome = Get-ChildItem $jdkRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '(^|-)17(-|$)' -and (Test-Path (Join-Path $_.FullName "bin\java.exe")) } |
    Select-Object -First 1 -ExpandProperty FullName
$sdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"

if (-not $javaHome) {
    throw "Java 17 not found under $jdkRoot. Install a JDK 17, then re-run this script."
}

function Set-UserEnv {
    param([string]$Name, [string]$Value)
    [Environment]::SetEnvironmentVariable($Name, $Value, 'User')
    Set-Item -Path "Env:$Name" -Value $Value
}

Set-UserEnv 'JAVA_HOME' $javaHome
Set-UserEnv 'ANDROID_HOME' $sdkRoot
Set-UserEnv 'ANDROID_SDK_ROOT' $sdkRoot

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$add = @(
    (Join-Path $javaHome 'bin'),
    (Join-Path $sdkRoot 'platform-tools'),
    (Join-Path $sdkRoot 'cmdline-tools\latest\bin')
)
foreach ($p in $add) {
    if ($userPath -notlike "*$p*") {
        if ($userPath) { $userPath = "$userPath;$p" } else { $userPath = $p }
    }
}
[Environment]::SetEnvironmentVariable('Path', $userPath, 'User')
$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$env:Path = "$machinePath;$userPath"

Write-Host "JAVA_HOME=$javaHome"
Write-Host "ANDROID_HOME=$sdkRoot"
& (Join-Path $javaHome 'bin\java.exe') -version

$sdkmanager = Join-Path $sdkRoot 'cmdline-tools\latest\bin\sdkmanager.bat'
if (-not (Test-Path $sdkmanager)) {
    Write-Host "cmdline-tools missing; run install step first."
    exit 1
}

Write-Host "Installing SDK packages..."
'yes' | & $sdkmanager --sdk_root=$sdkRoot --licenses | Out-Null
& $sdkmanager --sdk_root=$sdkRoot 'platform-tools' 'platforms;android-35' 'build-tools;35.0.0'

Write-Host 'Environment configured. Open a NEW terminal, then:'
Write-Host '  npx eas-cli build -p android --profile preview --local'
