$services = @(
    "services/muse-auth-service",
    "services/muse-notes-service",
    "services/muse-feed-service",
    "services/muse-parental-service",
    "services/muse-journal-service",
    "services/muse-chat-service",
    "services/muse-calendar-service",
    "services/muse-academic-service",
    "services/muse-assignment-service",
    "services/muse-classroom-service",
    "services/muse-labs-service"
)

Write-Host "Starting build for all services..." -ForegroundColor Green

foreach ($service in $services) {
    Write-Host "Building $service..." -ForegroundColor Cyan
    Push-Location $service
    cmd /c "mvn clean package -DskipTests"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed for $service"
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "Successfully built $service" -ForegroundColor Green
}

Write-Host "All services built successfully!" -ForegroundColor Green
Write-Host "You can now run 'docker-compose up --build'" -ForegroundColor Yellow
