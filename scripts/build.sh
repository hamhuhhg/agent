#!/bin/sh

# Build script for 1MCP Agent
# This script handles the complex build command logic

set -e

echo "🔨 Building 1MCP Agent..."

# Compile TypeScript
echo "📦 Compiling TypeScript..."
pnpm exec tsc --project tsconfig.build.json

# Resolve path aliases
echo "🔗 Resolving path aliases..."
pnpm exec tsc-alias -p tsconfig.build.json

# Copy web interface files
echo "📂 Copying web interface files..."
cp -r src/web build/web

# Make the built file executable
echo "🔧 Making build/index.js executable..."
node -e "require('fs').chmodSync('build/index.js', '755')"

echo "✅ Build completed successfully!"
