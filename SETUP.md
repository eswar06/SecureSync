# SecureSync Pro Setup Guide

This guide will help you set up the SecureSync Pro development environment on Windows.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 9+** - Comes with Node.js
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

## Quick Setup (Recommended)

1. **Run the automated setup script:**
   ```powershell
   .\setup.ps1
   ```

   This script will:
   - Check your system requirements
   - Create necessary directories
   - Set up environment files
   - Install all dependencies
   - Start development services

## Manual Setup

If you prefer to set up manually or encounter issues with the automated script:

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Backend dependencies
cd packages/backend
npm install
cd ../..

# Frontend dependencies
cd packages/frontend
npm install
cd ../..

# Shared dependencies
cd packages/shared
npm install
cd ../..
```

### 2. Set Up Environment Files

```bash
# Backend
cp packages/backend/env.example packages/backend/.env

# Frontend
cp packages/frontend/env.example packages/frontend/.env
```

**Important:** Update the `.env` files with your actual API keys and configuration values.

### 3. Start Development Services

```bash
# Start MongoDB, Redis, and TURN server
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or start them separately:
npm run dev:backend    # Backend on port 5000
npm run dev:frontend   # Frontend on port 3000
```

## Environment Configuration

### Required API Keys

- **OpenAI API Key** - For AI transcription and analysis
- **Google OAuth** - For authentication (optional for development)
- **Ethereum Private Key** - For blockchain audit trails (optional for development)

### Development vs Production

- **Development**: Uses `docker-compose.dev.yml` (no SSL, local services)
- **Production**: Uses `docker-compose.yml` (SSL, production-ready services)

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **TURN Server**: localhost:3478

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000, 5000, 27017, 6379, and 3478 are available
2. **Docker not running**: Start Docker Desktop before running setup
3. **Node.js version**: Ensure you have Node.js 18+ installed
4. **Permission errors**: Run PowerShell as Administrator if needed

### Service Status

```bash
# Check running containers
docker ps

# View service logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart services
docker-compose -f docker-compose.dev.yml restart
```

### Reset Environment

```bash
# Stop and remove all containers
docker-compose -f docker-compose.dev.yml down -v

# Remove node_modules (if dependency issues)
Remove-Item -Recurse -Force packages/*/node_modules
Remove-Item -Recurse -Force node_modules

# Reinstall dependencies
npm install
```

## Development Workflow

1. **Start services**: `docker-compose -f docker-compose.dev.yml up -d`
2. **Start dev servers**: `npm run dev`
3. **Make changes** to your code
4. **View changes** in browser (hot reload enabled)
5. **Stop services**: `docker-compose -f docker-compose.dev.yml down`

## Next Steps

After successful setup:

1. **Explore the codebase** - Check out the packages directory
2. **Read the main README** - For detailed project information
3. **Configure your environment** - Update .env files with real API keys
4. **Start developing** - Begin building your features!

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Docker and service logs
3. Ensure all prerequisites are met
4. Check the main README.md for additional information

---

**Happy coding with SecureSync Pro! 🚀**
