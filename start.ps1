Write-Host "Starting Gallery Application..."

Set-Location "$PSScriptRoot\gallery"

npm install --silent

Write-Host "Gallery Application starting on http://localhost:3000"
Write-Host "Press Ctrl+C to stop the application"

npm run prod

Read-Host "Press Enter to close"