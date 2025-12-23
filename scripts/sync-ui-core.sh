#!/bin/bash

# Sync core to UI package LWC
echo "Syncing core to UI package..."

SOURCE="packages/core/src/core"
TARGET="packages/ui/lwc/src/lightningCalendarUI/core"

# Remove old core from UI
rm -rf "$TARGET"

# Copy fresh core
cp -r "$SOURCE" "$TARGET"

echo "✓ Core synced to UI package"
echo "  From: $SOURCE"
echo "  To:   $TARGET"
