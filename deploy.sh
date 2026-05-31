#!/bin/bash

# ─────────────────────────────────────────────────────────────
#  Family Finance Hub — GitHub Pages Deploy Script
#  Usage: ./deploy.sh YOUR_GITHUB_USERNAME
# ─────────────────────────────────────────────────────────────

set -e

GITHUB_USER="${1}"
REPO_NAME="family-finance-hub"

if [ -z "$GITHUB_USER" ]; then
  echo ""
  echo "Usage: ./deploy.sh YOUR_GITHUB_USERNAME"
  echo ""
  echo "Example: ./deploy.sh johnsmith"
  exit 1
fi

REMOTE_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo ""
echo "==================================================="
echo "  Family Finance Hub — Deploying to GitHub Pages"
echo "==================================================="
echo "  User:   $GITHUB_USER"
echo "  Repo:   $REPO_NAME"
echo "  URL:    https://${GITHUB_USER}.github.io/${REPO_NAME}"
echo "==================================================="
echo ""

# Set homepage in package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.homepage = 'https://${GITHUB_USER}.github.io/${REPO_NAME}';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Set homepage to: ' + pkg.homepage);
"

# Init git if needed
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
  git branch -M main
fi

# Set remote origin
if git remote get-url origin &>/dev/null; then
  echo "Updating remote origin..."
  git remote set-url origin "$REMOTE_URL"
else
  echo "Adding remote origin..."
  git remote add origin "$REMOTE_URL"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Build
echo ""
echo "Building production bundle..."
npm run build

# Deploy to gh-pages branch
echo ""
echo "Deploying to GitHub Pages..."
npx gh-pages -d build -m "Deploy Family Finance Hub"

echo ""
echo "==================================================="
echo "  SUCCESS!"
echo ""
echo "  Your app will be live in ~60 seconds at:"
echo "  https://${GITHUB_USER}.github.io/${REPO_NAME}"
echo ""
echo "  First deploy? Go to your repo on GitHub:"
echo "  Settings > Pages > Source: gh-pages branch"
echo "==================================================="
echo ""
