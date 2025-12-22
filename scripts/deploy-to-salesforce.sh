#!/bin/bash

# Lightning Calendar - Salesforce Deployment Script
# This script builds and deploys the calendar to a Salesforce org

set -e  # Exit on error

echo "🚀 Lightning Calendar - Salesforce Deployment"
echo "============================================="

# Check if SFDX is installed
if ! command -v sfdx &> /dev/null; then
    echo "❌ SFDX CLI is not installed. Please install it first."
    echo "Visit: https://developer.salesforce.com/tools/sfdxcli"
    exit 1
fi

# Step 1: Build the calendar
echo "📦 Building Lightning Calendar..."
npm run build:legacy

# Step 2: Create deployment directory
echo "📁 Preparing deployment structure..."
rm -rf salesforce-deploy
mkdir -p salesforce-deploy/force-app/main/default/staticresources
mkdir -p salesforce-deploy/force-app/main/default/lwc

# Step 3: Copy static resource
echo "📋 Creating Static Resource..."
cp dist/lightning-calendar.min.js salesforce-deploy/force-app/main/default/staticresources/LightningCalendar.js

# Create resource metadata
cat > salesforce-deploy/force-app/main/default/staticresources/LightningCalendar.resource-meta.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
    <cacheControl>Public</cacheControl>
    <contentType>application/javascript</contentType>
    <description>Lightning Calendar Core Library</description>
</StaticResource>
EOF

# Step 4: Copy LWC components
echo "🎯 Copying LWC components..."
if [ -d "packages/lwc/force-app/main/default/lwc" ]; then
    cp -r packages/lwc/force-app/main/default/lwc/* salesforce-deploy/force-app/main/default/lwc/
    echo "✅ LWC components copied"
else
    echo "⚠️  No LWC components found in packages/lwc"
fi

# Step 5: Show deployment options
echo ""
echo "📌 Deployment Options:"
echo "======================================"
echo "1. Deploy to Scratch Org"
echo "2. Deploy to Sandbox"
echo "3. Deploy to Production"
echo "4. Deploy to Custom Org (by alias)"
echo "5. Skip deployment (manual deploy)"
echo ""
read -p "Select option (1-5): " option

case $option in
    1)
        echo "Creating and deploying to scratch org..."
        sfdx force:org:create -f config/project-scratch-def.json -a calendar-scratch -d 7
        sfdx force:source:deploy -p salesforce-deploy -u calendar-scratch
        sfdx force:org:open -u calendar-scratch
        echo "✅ Deployed to scratch org 'calendar-scratch'"
        ;;
    2)
        read -p "Enter sandbox username: " sandboxUser
        sfdx force:auth:web:login -a calendar-sandbox -r https://test.salesforce.com
        sfdx force:source:deploy -p salesforce-deploy -u calendar-sandbox
        echo "✅ Deployed to sandbox"
        ;;
    3)
        echo "⚠️  WARNING: Deploying to production!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            sfdx force:auth:web:login -a calendar-prod
            sfdx force:source:deploy -p salesforce-deploy -u calendar-prod
            echo "✅ Deployed to production"
        else
            echo "❌ Production deployment cancelled"
        fi
        ;;
    4)
        read -p "Enter org alias: " orgAlias
        sfdx force:source:deploy -p salesforce-deploy -u "$orgAlias"
        echo "✅ Deployed to $orgAlias"
        ;;
    5)
        echo "📦 Deployment package ready in: salesforce-deploy/"
        echo "Deploy manually using:"
        echo "  sfdx force:source:deploy -p salesforce-deploy -u YOUR_ORG"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process complete!"
echo ""
echo "📚 Next Steps:"
echo "1. Add the Lightning Calendar component to your Lightning page"
echo "2. Configure event data source (Apex controller or Flow)"
echo "3. Test the calendar functionality"
echo ""
echo "📖 Documentation: See SALESFORCE_DEPLOYMENT.md for details"