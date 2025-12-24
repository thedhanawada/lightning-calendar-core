#!/bin/bash

# Sync core to LWC
echo "Syncing core to Salesforce LWC..."

SOURCE="core/core"
TARGET="packages/examples/lwc-ui/force-app/main/default/lwc/lightningCalendarCore/core"

# Remove old core from LWC
rm -rf "$TARGET"

# Copy fresh core
cp -r "$SOURCE" "$TARGET"

echo "✓ Core synced to LWC"
echo "  From: $SOURCE"
echo "  To:   $TARGET"
