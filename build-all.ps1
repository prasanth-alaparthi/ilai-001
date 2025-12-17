# Build All Services Script
# Usage: .\build-all.ps1 [command]
# Commands: compile, package (default), clean, install

param(
    [Parameter(Position=0)]
    [ValidateSet("compile", "package", "clean", "install")]
    [string]$Command = "package",
    
    [switch]$SkipTests = $true,
    [switch]$Parallel = $false
)

$services = @(
    "services/muse-auth-service",
    "services/muse-notes-service",
    "services/muse-academic-service",
    "services/muse-social-service",
    "services/muse-ai-service"
)

# Build Maven command
$mvnArgs = "clean $Command"
if ($SkipTests) {
    $mvnArgs += " -DskipTests"
}

Write-Host "`n====================================" -ForegroundColor Magenta
Write-Host "  ILAI Build Script" -ForegroundColor Magenta
Write-Host "====================================`n" -ForegroundColor Magenta
Write-Host "Command: mvn $mvnArgs" -ForegroundColor Yellow
Write-Host "Services: $($services.Count)" -ForegroundColor Yellow
Write-Host ""

$startTime = Get-Date
$failedServices = @()
$successCount = 0

if ($Parallel) {
    Write-Host "Building services in parallel..." -ForegroundColor Cyan
    
    $jobs = $services | ForEach-Object {
        $service = $_
        Start-Job -ScriptBlock {
            param($svc, $args)
            Set-Location $using:PWD
            Push-Location $svc
            $result = cmd /c "mvn $args 2>&1"
            $exitCode = $LASTEXITCODE
            Pop-Location
            @{Service = $svc; ExitCode = $exitCode; Output = $result}
        } -ArgumentList $service, $mvnArgs
    }
    
    $results = $jobs | Wait-Job | Receive-Job
    $jobs | Remove-Job
    
    foreach ($result in $results) {
        if ($result.ExitCode -eq 0) {
            Write-Host "[OK] $($result.Service)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "[FAIL] $($result.Service)" -ForegroundColor Red
            $failedServices += $result.Service
        }
    }
} else {
    # Sequential build
    foreach ($service in $services) {
        Write-Host "`n[$($successCount + $failedServices.Count + 1)/$($services.Count)] Building $service..." -ForegroundColor Cyan
        
        Push-Location $service
        cmd /c "mvn $mvnArgs"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[FAIL] $service" -ForegroundColor Red
            $failedServices += $service
            Pop-Location
            
            # Ask to continue or abort
            $continue = Read-Host "Continue with remaining services? (Y/n)"
            if ($continue -eq "n" -or $continue -eq "N") {
                break
            }
            continue
        }
        
        Pop-Location
        Write-Host "[OK] $service" -ForegroundColor Green
        $successCount++
    }
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n====================================" -ForegroundColor Magenta
Write-Host "  Build Summary" -ForegroundColor Magenta
Write-Host "====================================`n" -ForegroundColor Magenta

Write-Host "Duration: $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor Yellow
Write-Host "Success:  $successCount / $($services.Count)" -ForegroundColor $(if ($successCount -eq $services.Count) { "Green" } else { "Yellow" })

if ($failedServices.Count -gt 0) {
    Write-Host "`nFailed Services:" -ForegroundColor Red
    foreach ($failed in $failedServices) {
        Write-Host "  - $failed" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`nAll services built successfully!" -ForegroundColor Green
Write-Host "Next: docker-compose up --build" -ForegroundColor Cyan
