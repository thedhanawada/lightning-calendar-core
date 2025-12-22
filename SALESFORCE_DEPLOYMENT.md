# Salesforce Deployment Guide for Lightning Calendar

## Overview
This guide explains how to deploy Lightning Calendar to a Salesforce org.

## Architecture
```
┌─────────────────────────────┐
│   Lightning Calendar Core    │  (Pure JS - 20KB minified)
└──────────────┬──────────────┘
               │
               ▼ Build & Deploy
┌─────────────────────────────┐
│     Static Resource         │  (Uploaded to Salesforce)
│  "LightningCalendar.js"     │
└──────────────┬──────────────┘
               │
               ▼ Import & Use
┌─────────────────────────────┐
│    LWC Wrapper Components   │
│  - lightningCalendar        │
│  - calendarMonthView        │
│  - calendarWeekView         │
└─────────────────────────────┘
```

## Deployment Steps

### Step 1: Build the Static Resource

```bash
# Build minified version
npm run build:core

# This creates: dist/lightning-calendar.min.js (20KB)
```

### Step 2: Deploy Static Resource to Salesforce

#### Option A: Using SFDX CLI
```bash
# Create static resource metadata
mkdir -p force-app/main/default/staticresources

# Copy the built file
cp dist/lightning-calendar.min.js force-app/main/default/staticresources/LightningCalendar.js

# Create metadata XML
cat > force-app/main/default/staticresources/LightningCalendar.resource-meta.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
    <cacheControl>Public</cacheControl>
    <contentType>application/javascript</contentType>
</StaticResource>
EOF

# Deploy to org
sfdx force:source:deploy -p force-app/main/default/staticresources -u myorg
```

#### Option B: Manual Upload (Setup UI)
1. Go to Setup → Static Resources
2. Click "New"
3. Name: `LightningCalendar`
4. File: Upload `dist/lightning-calendar.min.js`
5. Cache Control: Public
6. Save

### Step 3: Create LWC Wrapper

```javascript
// force-app/main/default/lwc/calendarWrapper/calendarWrapper.js
import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import CALENDAR_LIB from '@salesforce/resourceUrl/LightningCalendar';

export default class CalendarWrapper extends LightningElement {
    @api events = [];
    calendarInitialized = false;
    calendar;

    async connectedCallback() {
        try {
            // Load the calendar library
            await loadScript(this, CALENDAR_LIB);

            // Initialize calendar
            this.initializeCalendar();
        } catch (error) {
            console.error('Error loading calendar:', error);
        }
    }

    initializeCalendar() {
        const container = this.template.querySelector('.calendar-container');

        // Create calendar instance
        this.calendar = new window.LightningCalendar.Calendar();

        // Create renderer
        const renderer = new window.LightningCalendar.VanillaDOMRenderer(
            container,
            this.calendar
        );

        // Set events if provided
        if (this.events && this.events.length > 0) {
            this.calendar.setEvents(this.events);
        }

        // Listen for calendar events
        this.calendar.on('eventClick', (event) => {
            this.dispatchEvent(new CustomEvent('eventclick', {
                detail: event
            }));
        });

        this.calendarInitialized = true;
    }

    @api
    addEvent(event) {
        if (this.calendar) {
            this.calendar.addEvent(event);
        }
    }

    @api
    removeEvent(eventId) {
        if (this.calendar) {
            this.calendar.removeEvent(eventId);
        }
    }

    @api
    setView(viewType) {
        if (this.calendar) {
            this.calendar.setView(viewType);
        }
    }
}
```

### Step 4: Use in Salesforce

```html
<!-- In any LWC or Aura component -->
<template>
    <c-calendar-wrapper
        events={myEvents}
        oneventclick={handleEventClick}>
    </c-calendar-wrapper>
</template>
```

```javascript
// Controller
import { LightningElement, wire } from 'lwc';
import getEvents from '@salesforce/apex/CalendarController.getEvents';

export default class MyCalendarPage extends LightningElement {
    myEvents = [];

    @wire(getEvents)
    wiredEvents({ error, data }) {
        if (data) {
            // Transform Salesforce data to calendar format
            this.myEvents = data.map(event => ({
                id: event.Id,
                title: event.Subject,
                start: event.StartDateTime,
                end: event.EndDateTime,
                description: event.Description
            }));
        }
    }

    handleEventClick(event) {
        // Handle event click
        console.log('Event clicked:', event.detail);
    }
}
```

## Deployment Options Comparison

| Method | Pros | Cons | Use When |
|--------|------|------|----------|
| **Static Resource** | - Small size (20KB)<br>- Easy updates<br>- Cached | - Extra deployment step<br>- Version management | Most projects |
| **Direct Bundle** | - Single deployment<br>- No static resource | - Larger component<br>- Harder to update core | Simple projects |
| **Unlocked Package** | - Version control<br>- Dependencies<br>- Professional | - More complex<br>- Package namespace | Enterprise/AppExchange |
| **NPM Package** | - Standard JS tooling<br>- External version control | - Not Salesforce native<br>- Requires build step | Cross-platform projects |

## Quick Start Script

```bash
#!/bin/bash
# deploy-to-salesforce.sh

echo "Building Lightning Calendar for Salesforce..."

# 1. Build the library
npm run build:core

# 2. Prepare Salesforce structure
mkdir -p salesforce-deploy/staticresources
cp dist/lightning-calendar.min.js salesforce-deploy/staticresources/LightningCalendar.js

# 3. Create metadata
cat > salesforce-deploy/staticresources/LightningCalendar.resource-meta.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
    <cacheControl>Public</cacheControl>
    <contentType>application/javascript</contentType>
</StaticResource>
EOF

# 4. Copy LWC components
cp -r packages/lwc/force-app/main/default/lwc salesforce-deploy/

# 5. Deploy to org
read -p "Enter your Salesforce org alias: " orgAlias
sfdx force:source:deploy -p salesforce-deploy -u $orgAlias

echo "Deployment complete!"
```

## Testing in a New Scratch Org

```bash
# Create scratch org
sfdx force:org:create -f config/project-scratch-def.json -a calendar-test

# Push source
sfdx force:source:push -u calendar-test

# Open org
sfdx force:org:open -u calendar-test

# Assign permission set (if needed)
sfdx force:user:permset:assign -n Calendar_User -u calendar-test
```

## Common Issues & Solutions

### Issue 1: Calendar not loading
**Solution:** Check browser console for Static Resource loading errors. Ensure resource name matches import.

### Issue 2: Locker Service errors
**Solution:** Calendar is designed to be Locker-compliant, but check for any global variable access.

### Issue 3: Events not showing
**Solution:** Verify date formats. Salesforce DateTimes need conversion to JS Date objects.

### Issue 4: Styling issues
**Solution:** Use Shadow DOM styling or load CSS as separate static resource.

## Best Practices

1. **Version your Static Resource** with dates: `LightningCalendar_2024_01_15.js`
2. **Use Apex controllers** for data fetching, not JavaScript remoting
3. **Handle timezone conversion** between Salesforce and JavaScript
4. **Cache calendar instances** to avoid recreating on every render
5. **Use Lightning Data Service** where possible for record operations

## Production Deployment Checklist

- [ ] Minified JavaScript bundle < 50KB
- [ ] Locker Service compliance tested
- [ ] Cross-browser testing (Chrome, Safari, Edge)
- [ ] Mobile responsive testing
- [ ] Governor limits considered for Apex
- [ ] Error handling implemented
- [ ] Console logging removed/minimized
- [ ] Security review passed
- [ ] Performance testing completed
- [ ] Documentation updated