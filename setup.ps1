# SecureSync Pro Setup Script for Windows
# This script will set up the development environment

Write-Host "🚀 Setting up SecureSync Pro Development Environment..." -ForegroundColor Green

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and run this script again." -ForegroundColor Red
    exit 1
}

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($nodeVersion -match "v(\d+)") {
    $majorVersion = [int]$matches[1]
    if ($majorVersion -ge 18) {
        Write-Host "✅ Node.js $nodeVersion is compatible" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js $nodeVersion is too old. Please install Node.js 18+." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+." -ForegroundColor Red
    exit 1
}

# Check npm version
Write-Host "Checking npm version..." -ForegroundColor Yellow
$npmVersion = npm --version
Write-Host "✅ npm $npmVersion is available" -ForegroundColor Green

# Create necessary directories
Write-Host "Creating necessary directories..." -ForegroundColor Yellow
$directories = @(
    "logs",
    "uploads",
    "infrastructure/docker/nginx/ssl"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    }
}

# Copy environment files
Write-Host "Setting up environment files..." -ForegroundColor Yellow
if (!(Test-Path "packages/backend/.env")) {
    Copy-Item "packages/backend/env.example" "packages/backend/.env"
    Write-Host "✅ Created backend .env file" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Backend .env file already exists" -ForegroundColor Blue
}

if (!(Test-Path "packages/frontend/.env")) {
    Copy-Item "packages/frontend/env.example" "packages/frontend/.env"
    Write-Host "✅ Created frontend .env file" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Frontend .env file already exists" -ForegroundColor Blue
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "Installing root dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location packages/backend
npm install
Set-Location ../..

Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location packages/frontend
npm install
Set-Location ../..

Write-Host "Installing shared dependencies..." -ForegroundColor Cyan
Set-Location packages/shared
npm install
Set-Location ../..

# Start development services
Write-Host "Starting development services..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "Checking service status..." -ForegroundColor Yellow
$services = @("mongodb", "redis", "coturn")
foreach ($service in $services) {
    $status = docker ps --filter "name=securesync-$service-dev" --format "table {{.Status}}"
    if ($status -match "Up") {
        Write-Host "✅ $service is running" -ForegroundColor Green
    } else {
        Write-Host "❌ $service is not running" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update the .env files with your actual API keys and configuration" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start the development servers" -ForegroundColor White
Write-Host "3. Access the application at http://localhost:3000" -ForegroundColor White
Write-Host "4. API will be available at http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "To stop services: docker-compose -f docker-compose.dev.yml down" -ForegroundColor Yellow
Write-Host "To view logs: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor Yellow
