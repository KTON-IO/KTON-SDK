# Contributing to KTON SDK

We love your input! We want to make contributing to KTON SDK as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🚀 Quick Start for Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/kton-sdk.git
   cd kton-sdk
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/amazing-feature
   ```

## 🛠️ Development Workflow

### Setting up the Development Environment

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode (with file watching)
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

### Making Changes

1. **Make your changes** in the appropriate files
2. **Add tests** if you're adding functionality
3. **Update documentation** if needed
4. **Run the linters**:
   ```bash
   npm run lint:fix
   npm run format
   ```
5. **Test your changes**:
   ```bash
   npm run build
   npm run test
   ```

## 📝 Pull Request Process

1. **Update the README.md** with details of changes if needed
2. **Update the version numbers** in any examples files and the README.md to the new version that this Pull Request would represent
3. **Ensure your code follows our style guidelines**
4. **Write clear, concise commit messages**
5. **Include tests for new functionality**
6. **Update documentation as needed**

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Examples:
```
feat: add instant unstaking functionality
fix: resolve balance calculation issue
docs: update API documentation
style: format code with prettier
refactor: simplify staking logic
test: add unit tests for balance methods
chore: update dependencies
```

## 🐛 Bug Reports

We use GitHub Issues to track public bugs. Report a bug by [opening a new issue](https://github.com/rainboltz/kton-sdk/issues).

### Great Bug Reports Include:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

**Bug Report Template:**
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment:**
- OS: [e.g. iOS, Windows, Linux]
- Browser [e.g. chrome, safari]
- KTON SDK Version [e.g. 1.0.0]
- Node.js Version [e.g. 16.14.0]

**Additional context**
Add any other context about the problem here.
```

## 💡 Feature Requests

We love feature requests! Please [open an issue](https://github.com/rainboltz/kton-sdk/issues) with:

- Clear description of the feature
- Why you want this feature
- How it should work
- Any implementation ideas you have

## 🎯 Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`
- Use async/await over Promises where possible

### Formatting

We use Prettier and ESLint for consistent code formatting:

```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format

# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### File Structure

```
src/
├── index.ts          # Main entry point
├── kton.ts          # Core KTON class
├── constants.ts     # Constants and configuration
├── cache.ts         # Caching utilities
├── pool.ts          # Pool data parsing
└── utils.ts         # Utility functions
```

## 📋 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new functionality
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies
- Aim for high test coverage

Example test structure:
```typescript
describe('KTON SDK', () => {
  describe('staking operations', () => {
    it('should stake TON successfully', async () => {
      // Test implementation
    });
    
    it('should handle staking errors', async () => {
      // Test error handling
    });
  });
});
```

## 📚 Documentation

### API Documentation

- Use JSDoc comments for all public methods
- Include parameter types and descriptions
- Provide usage examples
- Document error conditions

Example:
```typescript
/**
 * Stakes the specified amount of TON tokens
 * @param amount - The amount of TON to stake (in TON)
 * @returns Promise resolving to transaction response
 * @throws {Error} When wallet is not connected or amount is invalid
 * @example
 * ```typescript
 * await kton.stake(1.5); // Stakes 1.5 TON
 * ```
 */
async stake(amount: number): Promise<SendTransactionResponse> {
  // Implementation
}
```

### README Updates

When adding new features:
- Update the feature list
- Add usage examples
- Update the API reference section

## 🏷️ Versioning

We use [Semantic Versioning](http://semver.org/). For the versions available, see the [tags on this repository](https://github.com/rainboltz/kton-sdk/tags).

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## 📄 License

By contributing to KTON SDK, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

Feel free to:
- Open a [GitHub Discussion](https://github.com/rainboltz/kton-sdk/discussions)
- Join our [Telegram channel](https://t.me/kton_sdk)
- Email us at dev@kton.io

## 🙏 Recognition

Contributors are recognized in our [Contributors](https://github.com/rainboltz/kton-sdk/graphs/contributors) page and in release notes for significant contributions.

Thank you for contributing to KTON SDK! 🎉