<#
 Runs the Selenium + TestNG suite after checking that frontend and backend are reachable.
 Usage:  .\scripts\run-ui-tests.ps1 [-BaseUrl http://localhost:5173] [-ApiUrl http://localhost:5000/api]
                                    [-Browser chrome|firefox|edge] [-Headless $true|$false]
#>
param(
    [string]$BaseUrl = "http://localhost:5173",
    [string]$ApiUrl = "http://localhost:5000/api",
    [string]$Browser = "chrome",
    [bool]$Headless = $true
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

try { Invoke-RestMethod "$ApiUrl/health" | Out-Null }
catch { throw "Backend is not reachable at $ApiUrl. Start it first (.\scripts\start-test-env.ps1)." }
try { Invoke-WebRequest $BaseUrl -UseBasicParsing | Out-Null }
catch { throw "Frontend is not reachable at $BaseUrl. Start it first (.\scripts\start-test-env.ps1)." }

Push-Location (Join-Path $root "automation-tests")
try {
    mvn test "-DBASE_URL=$BaseUrl" "-DAPI_URL=$ApiUrl" "-DBROWSER=$Browser" "-DHEADLESS=$Headless"
}
finally { Pop-Location }

Write-Host "`nReports     : automation-tests\target\surefire-reports\index.html (and emailable-report.html)"
Write-Host "Screenshots : automation-tests\target\screenshots\ (failures only)"
