#!/bin/bash

# KTON SDK Release Script
# Usage: ./scripts/release.sh [patch|minor|major|custom]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if git is clean
check_git_status() {
    if [[ -n $(git status --porcelain) ]]; then
        log_error "Working directory is not clean. Please commit or stash your changes."
        exit 1
    fi
    log_success "Working directory is clean"
}

# Check if we're on main branch
check_main_branch() {
    current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" ]]; then
        log_error "You must be on the main branch to release. Current branch: $current_branch"
        exit 1
    fi
    log_success "On main branch"
}

# Run all checks
run_checks() {
    log_info "Running pre-release checks..."
    
    log_info "Installing dependencies..."
    npm ci
    
    log_info "Running type check..."
    npm run typecheck
    
    log_info "Running linter..."
    npm run lint
    
    log_info "Checking code formatting..."
    npm run format:check
    
    log_info "Running tests..."
    npm run test:run
    
    log_info "Building project..."
    npm run build
    
    log_success "All checks passed!"
}

# Get current version
get_current_version() {
    node -p "require('./package.json').version"
}

# Bump version
bump_version() {
    local version_type=$1
    local custom_version=$2
    
    if [[ "$version_type" == "custom" ]]; then
        if [[ -z "$custom_version" ]]; then
            read -p "Enter the new version (current: $(get_current_version)): " custom_version
        fi
        npm version "$custom_version" --no-git-tag-version
    else
        npm version "$version_type" --no-git-tag-version
    fi
}

# Create release commit and tag
create_release() {
    local new_version=$(get_current_version)
    
    log_info "Creating release commit for version $new_version..."
    git add package.json
    git commit -m "chore: bump version to $new_version"
    
    log_info "Creating git tag v$new_version..."
    git tag "v$new_version"
    
    log_success "Created release commit and tag for v$new_version"
}

# Push release
push_release() {
    local new_version=$(get_current_version)
    
    log_warning "Ready to push release v$new_version to GitHub"
    read -p "Do you want to push now? This will trigger the automated release process. (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Pushing to GitHub..."
        git push origin main --tags
        log_success "Release pushed! Check GitHub Actions for progress:"
        log_info "https://github.com/rainboltz/kton-sdk/actions"
    else
        log_info "Release created locally. You can push later with:"
        log_info "  git push origin main --tags"
    fi
}

# Main script
main() {
    local version_type=${1:-"patch"}
    local custom_version=$2
    
    echo -e "${GREEN}🚀 KTON SDK Release Script${NC}"
    echo "================================"
    
    # Validate version type
    if [[ ! "$version_type" =~ ^(patch|minor|major|custom)$ ]]; then
        log_error "Invalid version type. Use: patch, minor, major, or custom"
        exit 1
    fi
    
    log_info "Release type: $version_type"
    log_info "Current version: $(get_current_version)"
    
    # Pre-flight checks
    check_git_status
    check_main_branch
    
    # Run all checks
    run_checks
    
    # Show what will happen
    if [[ "$version_type" == "custom" ]]; then
        log_info "Will create custom version release"
    else
        local preview_version=$(npm version "$version_type" --dry-run)
        log_info "Will create $version_type release: $preview_version"
    fi
    
    read -p "Continue with release? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Release cancelled"
        exit 0
    fi
    
    # Execute release
    bump_version "$version_type" "$custom_version"
    create_release
    push_release
    
    echo
    log_success "Release process completed!"
    log_info "Monitor the release at: https://github.com/rainboltz/kton-sdk/releases"
    log_info "NPM package will be available at: https://www.npmjs.com/package/kton-sdk"
}

# Run main function with all arguments
main "$@"