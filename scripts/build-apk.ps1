# 打 Android APK（EAS 云端）
# 前置：本机已 npm install；需 Expo 账号（免费）
# 用法：在项目根目录执行  .\scripts\build-apk.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "==> 检查登录状态..." -ForegroundColor Cyan
$who = npx.cmd eas-cli whoami 2>&1
if ($LASTEXITCODE -ne 0 -or "$who" -match "Not logged in") {
  Write-Host "未登录 Expo，即将打开登录（浏览器/终端按提示操作）..." -ForegroundColor Yellow
  npx.cmd eas-cli login
}

Write-Host "==> 关联/创建 EAS 项目（若已关联会跳过）..." -ForegroundColor Cyan
npx.cmd eas-cli init --id --non-interactive 2>$null
if ($LASTEXITCODE -ne 0) {
  npx.cmd eas-cli init
}

Write-Host "==> 开始云端打包 APK（preview）..." -ForegroundColor Cyan
npx.cmd eas-cli build -p android --profile preview

Write-Host "完成后终端会给出 APK 下载链接。" -ForegroundColor Green
