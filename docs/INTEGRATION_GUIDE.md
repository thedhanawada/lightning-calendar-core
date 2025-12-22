# Lightning Calendar Core - Integration Guide

## What is Lightning Calendar Core?

Lightning Calendar Core is a **lightweight, zero-dependency JavaScript calendar engine** designed specifically for Salesforce environments but works anywhere JavaScript runs.

### Key Features:
- ✅ **20KB minified** - Smaller than moment.js alone
- ✅ **Zero dependencies** - No jQuery, no moment.js, no date-fns
- ✅ **Locker Service compliant** - Built for Salesforce security
- ✅ **Framework agnostic** - Use with LWC, Aura, React, Vue, or vanilla JS
- ✅ **Full-featured** - Recurring events, timezones, drag-drop, all views

## Quick Start (3 Steps)

### Step 1: Get the Library

**Option A: Download**
```bash
# Download the minified version (20KB)
wget https://github.com/thedhanawada/lightning-calendar/releases/latest/download/lightning-calendar.min.js
```

**Option B: Build from Source**
```bash
git clone https://github.com/thedhanawada/lightning-calendar.git
cd lightning-calendar/packages/core
npm install
npm run build
# Output: dist/lightning-calendar.min.js
```

### Step 2: Load the Library

**In HTML:**
```html
<script src="lightning-calendar.min.js"></script>
```

**In Salesforce (Static Resource):**
```javascript
import CALENDAR_LIB from '@salesforce/resourceUrl/LightningCalendar';
import { loadScript } from 'lightning/platformResourceLoader';

await loadScript(this, CALENDAR_LIB);
```

### Step 3: Create Your Calendar

```javascript
// Create calendar instance
const calendar = new LightningCalendar.Calendar();

// Create renderer for DOM
const container = document.getElementById('my-calendar');
const renderer = new LightningCalendar.VanillaDOMRenderer(container, calendar);

// Add events
calendar.addEvent({
    title: 'Team Meeting',
    start: new Date('2024-01-15 10:00'),
    end: new Date('2024-01-15 11:00')
});

// That's it! You have a working calendar
```

## Integration Examples

### 1. Salesforce Lightning Web Component (LWC)

```javascript
// calendarComponent.js
import { LightningElement } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import CALENDAR from '@salesforce/resourceUrl/LightningCalendar';

export default class CalendarComponent extends LightningElement {
    calendarInitialized = false;

    async renderedCallback() {
        if (this.calendarInitialized) return;

        await loadScript(this, CALENDAR);

        const container = this.template.querySelector('.calendar-container');
        this.calendar = new window.LightningCalendar.Calendar();
        this.renderer = new window.LightningCalendar.VanillaDOMRenderer(container, this.calendar);

        this.calendarInitialized = true;
    }
}
```

### 2. Salesforce Aura Component

```javascript
// In Aura controller
initCalendar: function(component) {
    const container = component.find("calendarDiv").getElement();
    const calendar = new window.LightningCalendar.Calendar();
    const renderer = new window.LightningCalendar.VanillaDOMRenderer(container, calendar);

    component.set("v.calendar", calendar);
}
```

### 3. Visualforce Page

```html
<apex:page>
    <apex:includeScript value="{!$Resource.LightningCalendar}"/>

    <div id="calendar"></div>

    <script>
        window.onload = function() {
            const calendar = new LightningCalendar.Calendar();
            const container = document.getElementById('calendar');
            const renderer = new LightningCalendar.VanillaDOMRenderer(container, calendar);
        };
    </script>
</apex:page>
```

### 4. React Component

```jsx
import { useEffect, useRef } from 'react';
import * as LightningCalendar from '@lightning-calendar/core';

function CalendarComponent() {
    const containerRef = useRef(null);
    const calendarRef = useRef(null);

    useEffect(() => {
        if (containerRef.current && !calendarRef.current) {
            const calendar = new LightningCalendar.Calendar();
            const renderer = new LightningCalendar.VanillaDOMRenderer(
                containerRef.current,
                calendar
            );
            calendarRef.current = calendar;
        }
    }, []);

    return <div ref={containerRef} style={{ height: '600px' }} />;
}
```

### 5. Vue Component

```vue
<template>
    <div ref="calendarContainer" class="calendar-container"></div>
</template>

<script>
import * as LightningCalendar from '@lightning-calendar/core';

export default {
    mounted() {
        this.calendar = new LightningCalendar.Calendar();
        this.renderer = new LightningCalendar.VanillaDOMRenderer(
            this.$refs.calendarContainer,
            this.calendar
        );
    }
}
</script>
```

## Core API

### Calendar Class

```javascript
const calendar = new LightningCalendar.Calendar(options);

// Options
{
    view: 'month',              // 'month', 'week', 'day', 'list'
    date: new Date(),          // Starting date
    weekStartsOn: 0,           // 0 = Sunday, 1 = Monday
    showWeekNumbers: false,    // Show week numbers
    businessHours: {           // Business hours
        start: '09:00',
        end: '17:00'
    },
    timeZone: 'America/New_York'  // IANA timezone
}
```

### Event Management

```javascript
// Add event
calendar.addEvent({
    id: 'event-1',
    title: 'Meeting',
    start: new Date('2024-01-15 10:00'),
    end: new Date('2024-01-15 11:00'),
    color: '#0070f3',
    allDay: false,
    recurring: false
});

// Update event
calendar.updateEvent('event-1', { title: 'Updated Meeting' });

// Remove event
calendar.removeEvent('event-1');

// Get all events
const events = calendar.getEvents();

// Query events
const todayEvents = calendar.queryEvents({
    start: startOfDay(new Date()),
    end: endOfDay(new Date())
});
```

### Recurring Events

```javascript
calendar.addEvent({
    title: 'Daily Standup',
    start: new Date('2024-01-15 09:00'),
    end: new Date('2024-01-15 09:30'),
    recurring: true,
    recurrenceRule: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20241231'
});

// Recurrence patterns supported:
// - FREQ=DAILY/WEEKLY/MONTHLY/YEARLY
// - INTERVAL=n
// - COUNT=n
// - UNTIL=date
// - BYDAY=MO,TU,WE,TH,FR
// - BYMONTHDAY=15
// - BYMONTH=1,6,12
```

### Navigation

```javascript
calendar.next();           // Next month/week/day
calendar.previous();       // Previous month/week/day
calendar.today();          // Go to today
calendar.goToDate(date);   // Go to specific date
```

### Views

```javascript
calendar.setView('month');  // Switch to month view
calendar.setView('week');   // Switch to week view
calendar.setView('day');    // Switch to day view
calendar.setView('list');   // Switch to list view
```

### Events (not to be confused with calendar events)

```javascript
// Listen for calendar interactions
calendar.on('eventClick', (event) => {
    console.log('Event clicked:', event);
});

calendar.on('dateClick', (date) => {
    console.log('Date clicked:', date);
});

calendar.on('viewChange', (view) => {
    console.log('View changed to:', view);
});

calendar.on('eventAdd', (event) => {
    console.log('Event added:', event);
});

calendar.on('eventUpdate', (event) => {
    console.log('Event updated:', event);
});

calendar.on('eventRemove', (eventId) => {
    console.log('Event removed:', eventId);
});
```

## DateUtils

The library includes 40+ date utility functions:

```javascript
const { DateUtils } = LightningCalendar;

// Date boundaries
DateUtils.startOfDay(date);
DateUtils.endOfDay(date);
DateUtils.startOfWeek(date);
DateUtils.endOfWeek(date);
DateUtils.startOfMonth(date);
DateUtils.endOfMonth(date);

// Date math
DateUtils.addDays(date, 5);
DateUtils.addWeeks(date, 2);
DateUtils.addMonths(date, 3);
DateUtils.differenceInDays(date1, date2);

// Date checking
DateUtils.isToday(date);
DateUtils.isPast(date);
DateUtils.isFuture(date);
DateUtils.isSameDay(date1, date2);
DateUtils.isWeekend(date);

// Formatting
DateUtils.format(date, 'YYYY-MM-DD');
DateUtils.formatTime(date, '12h');  // or '24h'

// Timezone
DateUtils.toTimeZone(date, 'America/New_York');
DateUtils.getTimezoneOffset('America/New_York');
```

## Salesforce-Specific Features

### Locker Service Compliance
- No eval() or Function() constructors
- No global mutations
- No document.write()
- Strict mode compatible
- CSP compliant

### Static Resource Deployment

1. Build the minified version:
```bash
npm run build
```

2. Upload to Salesforce:
- Setup → Static Resources → New
- Name: `LightningCalendar`
- File: `lightning-calendar.min.js`
- Cache Control: Public

3. Use in components:
```javascript
import CALENDAR from '@salesforce/resourceUrl/LightningCalendar';
```

### Working with Salesforce Data

```javascript
// Transform Salesforce Event to Calendar Event
function transformSalesforceEvent(sfEvent) {
    return {
        id: sfEvent.Id,
        title: sfEvent.Subject,
        start: new Date(sfEvent.StartDateTime),
        end: new Date(sfEvent.EndDateTime),
        allDay: sfEvent.IsAllDayEvent,
        description: sfEvent.Description,
        metadata: {
            recordId: sfEvent.Id,
            whoId: sfEvent.WhoId,
            whatId: sfEvent.WhatId
        }
    };
}

// Handle Salesforce timezone
const userTimeZone = $A.get("$Locale.timezone");
calendar.setTimeZone(userTimeZone);
```

## Performance

- **Bundle size**: 20KB minified, 7KB gzipped
- **Initial render**: < 50ms for 100 events
- **Memory**: ~2MB for 1000 events
- **Browser support**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+

## Migration from Other Libraries

### From FullCalendar
```javascript
// FullCalendar
$('#calendar').fullCalendar({
    events: events,
    view: 'month'
});

// Lightning Calendar (simpler!)
const calendar = new LightningCalendar.Calendar();
calendar.setEvents(events);
```

### From moment.js
```javascript
// Instead of moment.js
moment().startOf('day');
moment().add(1, 'week');

// Use built-in DateUtils
DateUtils.startOfDay(new Date());
DateUtils.addWeeks(new Date(), 1);
```

## Support

- **Documentation**: [GitHub Wiki](https://github.com/thedhanawada/lightning-calendar/wiki)
- **Issues**: [GitHub Issues](https://github.com/thedhanawada/lightning-calendar/issues)
- **Examples**: See `/packages/examples/` directory

## License

MIT License - Free for commercial and personal use.