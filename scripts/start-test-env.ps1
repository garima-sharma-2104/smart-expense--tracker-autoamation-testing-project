<#
 Starts the backend (against the dedicated TEST database) and the React dev server,
 each in its own PowerShell window. Prerequisite: MongoDB running locally.
 Usage:  .\scripts\start-test-env.ps1
#>
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$envTest = Join-Path $root "server\.env.test"
if (-not (Test-Path $envTest)) {
    Copy-Item (Join-Path $root "server\.env.test.example") $envTest
    # generate a random throw-away secret for the test environment
    $secret = -join ((48..57) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
    (Get-Content $envTest) -replace '^JWT_SECRET=.*', "JWT_SECRET=$secret" | Set-Content $envTest
    Write-Host "Created server\.env.test (database: smart-expense-tracker-test)"
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\server'; npm run start:test"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\client'; npm run dev -- --port 5173 --strictPort"
Write-Host "Backend  : http://localhost:5000/api/health"
Write-Host "Frontend : http://localhost:5173"
Write-Host "Wait until both windows show they are running, then run .\scripts\run-ui-tests.ps1"
