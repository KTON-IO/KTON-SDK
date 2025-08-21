# KTON SDK Repository Structure

## 📁 Repository Overview

```
kton-sdk/
├── 📄 README.md              # Main project documentation
├── 📄 CHANGELOG.md           # Version history and changes
├── 📄 CONTRIBUTING.md        # Contribution guidelines
├── 📄 LICENSE                # MIT License
├── 📄 package.json           # Package configuration
├── 📄 tsconfig.json          # TypeScript configuration
├── 📄 vite.config.js         # Build configuration
├── 📄 .eslintrc.json         # ESLint configuration
├── 📄 .prettierrc.json       # Prettier configuration
├── 📄 .gitignore             # Git ignore rules
│
├── 📁 src/                   # Source code
│   ├── 📄 index.ts           # Main entry point
│   ├── 📄 kton.ts            # Core KTON SDK class
│   ├── 📄 constants.ts       # Configuration constants
│   ├── 📄 cache.ts           # Caching utilities
│   ├── 📄 pool.ts            # Pool data parsing
│   └── 📄 utils.ts           # Utility functions
│
├── 📁 dist/                  # Built files (generated)
│   ├── 📄 kton-sdk.esm.js    # ES Module build
│   ├── 📄 kton-sdk.min.js    # UMD build (minified)
│   ├── 📄 kton-sdk.d.ts      # TypeScript declarations
│   └── 📄 *.map              # Source maps
│
├── 📁 demo/                  # Interactive demo
│   └── 📄 index.html         # Demo application
│
├── 📁 examples/              # Usage examples
│   ├── 📁 vanilla/           # Vanilla JavaScript example
│   ├── 📁 react/             # React integration example
│   └── 📁 node/              # Node.js server example
│
└── 📁 .github/               # GitHub configuration
    └── 📁 workflows/         # CI/CD workflows
        └── 📄 ci.yml         # Continuous integration
```

## 🎯 Key Components

### Core SDK (`src/`)
- **`kton.ts`**: Main SDK class with all staking functionality
- **`constants.ts`**: Configuration and contract addresses
- **`cache.ts`**: Network caching for performance optimization
- **`pool.ts`**: Staking pool data parsing utilities
- **`utils.ts`**: Helper functions and utilities

### Build System
- **Vite**: Modern build tool with TypeScript support
- **Dual Output**: ESM and UMD formats for maximum compatibility
- **Source Maps**: Debug support with full source mapping
- **Type Definitions**: Automatically generated TypeScript declarations

### Development Tools
- **ESLint**: Code quality and consistency enforcement
- **Prettier**: Automated code formatting
- **TypeScript**: Full type safety and IntelliSense support
- **GitHub Actions**: Automated CI/CD pipeline

## 🚀 Build Outputs

| File | Format | Size | Description |
|------|--------|------|-------------|
| `kton-sdk.esm.js` | ES Module | ~86 KB | Modern JavaScript imports |
| `kton-sdk.min.js` | UMD | ~34 KB | Browser-compatible bundle |
| `kton-sdk.d.ts` | TypeScript | - | Type definitions |

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build production bundle |
| `npm run dev` | Development mode with watch |
| `npm run clean` | Clean build artifacts |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Code linting with ESLint |
| `npm run format` | Code formatting with Prettier |
| `npm run docs` | Start demo server |

## 🎮 Demo & Examples

### Interactive Demo (`demo/`)
- Full-featured web application showcasing all SDK features
- Wallet connection and staking operations
- Real-time balance and analytics display
- Mobile-responsive design

### Code Examples (`examples/`)
- **Vanilla JavaScript**: Browser integration without frameworks
- **React**: Complete React application with hooks
- **Node.js**: Server-side implementation example

## 🔧 Configuration Files

### TypeScript (`tsconfig.json`)
- Target: ES2020
- Strict mode enabled
- DOM and Node.js type support

### Build (`vite.config.js`)
- Dual format output (ESM + UMD)
- External dependencies handling
- Source map generation
- Terser minification

### Code Quality
- **ESLint**: TypeScript-aware linting rules
- **Prettier**: Consistent code formatting
- **Git Hooks**: Pre-commit quality checks

## 🚦 CI/CD Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)
- **Multi-Node Testing**: Node.js 16, 18, 20
- **Quality Checks**: TypeScript, ESLint, Prettier
- **Build Verification**: Successful compilation test
- **Automated Publishing**: NPM release on tagged commits

### Workflow Steps
1. Code checkout and dependency installation
2. Type checking with TypeScript compiler
3. Code linting and formatting validation
4. Unit test execution
5. Build compilation and verification
6. Conditional NPM publishing

## 📦 Package Configuration

### Package.json Highlights
- **Dual Exports**: ESM and CommonJS compatibility
- **Type Definitions**: First-class TypeScript support
- **Engine Requirements**: Node.js >= 16.0.0
- **Development Scripts**: Complete workflow automation

### Dependencies
- **Runtime**: TON SDK, TonAPI SDK for blockchain interaction
- **Development**: TypeScript, Vite, ESLint, Prettier toolchain

## 🛡️ Quality Assurance

### Code Quality
- TypeScript strict mode for type safety
- ESLint rules for code consistency
- Prettier formatting for style uniformity
- Automated pre-commit hooks

### Testing Strategy
- Unit tests for core functionality
- Integration tests for blockchain interaction
- End-to-end tests for complete workflows
- Browser compatibility testing

### Performance Optimization
- Tree-shaking support for minimal bundles
- Efficient caching mechanisms
- Lazy loading for large operations
- Optimized API usage patterns

## 📈 Monitoring & Analytics

### Bundle Analysis
- Size tracking for both ESM and UMD builds
- Dependency analysis and optimization
- Performance benchmarking
- Load time optimization

### Usage Metrics
- API call patterns and optimization
- Error rate monitoring and improvement
- User feedback integration
- Performance profiling

This repository structure ensures maintainable, scalable, and professional-grade SDK development with modern tooling and best practices.