#!/bin/bash

# Sync core to LWC
echo "Syncing core to Salesforce LWC..."

SOURCE="packages/core/src/core"
TARGET="packages/examples/salesforce-lwc/force-app/main/default/lwc/lightningCalendar/core"

# Remove old core from LWC
rm -rf "$TARGET"

# Copy fresh core
cp -r "$SOURCE" "$TARGET"

echo "✓ Core synced to LWC"
echo "  From: $SOURCE"
echo "  To:   $TARGET"
