# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlowSonat is an Electron-based desktop application for Instagram automation, built with React, TypeScript, and Vite. The project supports cross-platform builds (Windows, macOS, Linux) and includes an automatic update system.

## Development Commands

### Basic Development
```bash
npm run dev              # Start development server
npm run typecheck        # Run TypeScript type checking
npm run lint             # Run ESLint
```

### Building
```bash
npm run build            # Full production build with typecheck
npm run build:prod       # Production build with API URL
npm run build:all        # Build for all platforms
npm run build:mac        # macOS build
npm run build:win        # Windows build  
npm run build:linux      # Linux build
npm run build:mac:signed # macOS signed build (requires .env.deploy)
```

### API Client Generation
```bash
npm run generate-api     # Generate API client from OpenAPI spec
npm run watch-api        # Watch for API changes and regenerate
```

### Version Management
```bash
npm run version:patch    # Increment patch version
npm run version:minor    # Increment minor version
npm run version:major    # Increment major version
npm run version:info     # Generate version-info.json
```

## Architecture Overview

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Electron 30
- **UI**: Radix UI + Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router DOM v7
- **API**: OpenAPI TypeScript Codegen
- **Build**: Electron Builder for multi-platform

### Project Structure
```
src/
├── api/           # Auto-generated OpenAPI client
├── components/    # Reusable UI components (shadcn/ui based)
├── contexts/      # React Contexts (Auth, Instagram)
├── features/      # Feature-specific modules
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # Business logic services
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── main.tsx       # React app entry point

electron/
├── main.ts        # Electron main process (includes auto-updater)
└── preload.ts     # Electron preload script
```

### Key Patterns

#### Authentication Flow
- Uses JWT tokens (access + refresh) stored in localStorage
- `AuthContext` provides authentication state and methods
- `ProtectedRoute` component for route protection
- Automatic token refresh via interceptors

#### API Integration
- Auto-generated client from OpenAPI spec at `localhost:8000/openapi.json`
- Base URL configurable via `VITE_API_BASE_URL` environment variable
- Token automatically attached to requests via OpenAPI config

#### State Management
- React Context for global state (Auth, Instagram)
- React Hook Form for form state
- Custom hooks for component-level state

#### Electron Integration
- Main process handles auto-updates, system integration
- Preload script exposes safe APIs to renderer
- IPC communication for desktop features

### Development Workflow

#### Code Quality
Always run before committing:
```bash
npm run typecheck && npm run lint
```

#### Environment Variable Debugging
Comprehensive debugging tools for environment variable issues:

```bash
# Debug current environment configuration
./scripts/debug-env.sh [mode]            # Comprehensive environment debug report

# Runtime debugging (in browser console)
window.__envDebugger.logDebugInfo()      # Log current environment state
window.__envDebugger.takeSnapshot()      # Take environment snapshot
window.__envDebugger.exportDebugReport() # Export full debug report

# Build verification
node scripts/verify-build-env.js         # Verify environment vars in build output
```

**Debug Features:**
- **Runtime Tracking**: Monitors environment variables for changes during execution
- **Build-time Logging**: Shows environment loading during Vite build process  
- **Deployment Validation**: Verifies environment setup before deployment
- **Post-build Verification**: Confirms correct environment embedding in build artifacts
- **Browser Console Logs**: Comprehensive environment state logging on app startup

#### API Development
1. Start backend server on `localhost:8000`
2. Generate API client: `npm run generate-api`
3. Use generated types and services from `src/api/`

#### Testing New Features
1. Use `npm run dev` for hot reload development
2. Test Electron features with `npm run build` then check `dist-electron/`
3. Verify cross-platform builds before release

### Build System

#### Environment Variables
- `.env.local`: Local development overrides
- `.env.deploy`: Deployment credentials (AWS, signing)
- `VITE_API_BASE_URL`: API server URL
- `VITE_APP_VERSION`: Injected from package.json

#### Electron Builder Configuration
- `electron-builder.json5`: Multi-platform build configuration
- Auto-updater configured for S3-hosted releases
- Code signing setup for macOS (requires certificates)

#### Deployment Pipeline
- `./scripts/deploy.sh`: Automated deployment to S3
- `version-info.json`: Auto-generated update manifest
- Platform-specific artifacts uploaded to S3

### Auto-Update System
- Checks for updates on startup and hourly
- Downloads platform-specific installers from S3
- Supports forced updates via `minSupportedVersion`
- User notifications with download progress

### Path Aliases
- `@/*` → `src/*` (configured in tsconfig.json and vite.config.ts)

### ESLint Configuration
- Relaxed rules for Electron integration complexity
- Ignores generated API code and build artifacts
- `@typescript-eslint/no-explicit-any`: off (Electron needs flexibility)