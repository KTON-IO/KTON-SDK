# Release Guide

This document explains how to release a new version of the KTON SDK.

## Automated Release Process

This project uses GitHub Actions for automated releases, including:
- Automatic GitHub Release creation
- Automatic NPM publishing
- Automatic changelog generation
- Automatic build artifact uploads

## Publishing New Versions

### Method 1: Using npm scripts (Recommended)

1. **Publish patch version** (1.0.0 → 1.0.1):
   ```bash
   npm run release:patch
   npm run release:push
   ```

2. **Publish minor version** (1.0.0 → 1.1.0):
   ```bash
   npm run release:minor
   npm run release:push
   ```

3. **Publish major version** (1.0.0 → 2.0.0):
   ```bash
   npm run release:major
   npm run release:push
   ```

### Method 2: Manual process

1. **Update version number**:
   ```bash
   npm version patch  # or minor, major
   ```

2. **Create and push tag**:
   ```bash
   git push origin main --tags
   ```

## Pre-release Versions

To publish beta or alpha versions:

1. **Manually set pre-release version**:
   ```bash
   npm version 1.0.0-beta.1 --no-git-tag-version
   git add package.json
   git commit -m "chore: bump version to 1.0.0-beta.1"
   git tag v1.0.0-beta.1
   git push origin main --tags
   ```

Pre-release versions will:
- Be marked as "Pre-release" in GitHub Releases
- Be published to NPM under the `beta` tag instead of `latest`

## Release Checklist

Before releasing, ensure:

- [ ] All tests pass
- [ ] Code formatting checks pass
- [ ] TypeScript type checks pass
- [ ] ESLint checks pass
- [ ] Documentation is updated
- [ ] CHANGELOG or commit messages clearly describe changes

## Release Process Overview

When you push a version tag (like `v1.0.0`) to GitHub, the following process is automatically triggered:

1. **Test and Build**: Run all tests and checks on multiple Node.js versions
2. **Create Release**: Automatically generate changelog and create GitHub Release
3. **Publish to NPM**: Verify version number matches and publish to NPM
4. **Upload Assets**: Upload built distribution files
5. **Update Release**: Add NPM package link to release description

## Environment Setup

Ensure your GitHub repository has the following secrets configured:

- `NPM_TOKEN`: NPM publishing token
- `GITHUB_TOKEN`: Automatically provided, used for creating releases

## Version Rollback

If you need to rollback:

1. **Unpublish from NPM**:
   ```bash
   npm unpublish kton-sdk@version --force
   ```

2. **Delete GitHub Release**:
   Manually delete from GitHub web interface

3. **Delete tag**:
   ```bash
   git tag -d v1.0.0
   git push origin :refs/tags/v1.0.0
   ```

## Troubleshooting

### Common Issues

1. **Version mismatch**: Ensure version in `package.json` matches the git tag
2. **NPM publish failure**: Check if `NPM_TOKEN` is correctly set and valid
3. **Test failures**: Run `npm test` locally to ensure all tests pass

### Check Release Status

- GitHub Actions: https://github.com/rainboltz/kton-sdk/actions
- NPM Package: https://www.npmjs.com/package/kton-sdk
- GitHub Releases: https://github.com/rainboltz/kton-sdk/releases