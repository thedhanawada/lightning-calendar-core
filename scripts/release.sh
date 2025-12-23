#!/bin/bash

# Release script for Lightning Calendar Core
# Usage: ./scripts/release.sh [version]
# Example: ./scripts/release.sh 0.2.0

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Error: Version required"
  echo "Usage: ./scripts/release.sh [version]"
  echo "Example: ./scripts/release.sh 0.2.0"
  exit 1
fi

# Add v prefix if not present
if [[ ! $VERSION =~ ^v ]]; then
  VERSION="v$VERSION"
fi

echo "Creating release $VERSION..."

# Ensure we're on master and up to date
git checkout master
git pull origin master

# Update package.json version (remove v prefix for package.json)
PACKAGE_VERSION="${VERSION#v}"
cd packages/core
npm version $PACKAGE_VERSION --no-git-tag-version
cd ../..

# Sync core to LWC
npm run sync:lwc

# Commit version bump
git add packages/core/package.json
git add packages/examples/salesforce-lwc/force-app/main/default/lwc/lightningCalendar/core/
git commit -m "Release $VERSION" || true

# Create and push tag
git tag -a $VERSION -m "Release $VERSION"
git push origin master
git push origin $VERSION

echo "✓ Release $VERSION created!"
echo "  GitHub Actions will build and publish the release"
echo "  View at: https://github.com/thedhanawada/lightning-calendar-core/releases/tag/$VERSION"
