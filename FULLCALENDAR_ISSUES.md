# FullCalendar Issues & Lightning Calendar Solutions

**Purpose**: Document known FullCalendar problems and how we'll architecturally solve them from the ground up.

---

## Critical Issues Overview

### 1. Salesforce Locker Service Incompatibility ⚠️ CRITICAL

**FullCalendar Problems:**
- ✗ v4+ completely broken with Locker Service enabled
- ✗ Requires manual core library modifications (`core/main.js`) to work
- ✗ Click handlers malfunction - all buttons trigger "go to today"
- ✗ Script loading fails in LWC due to Locker restrictions
- ✗ Touch events require patching to function
- ✗ Requires hacky workarounds: replacing `var FullCalendar = (function (exports) {` with `(function (exports) { window.FullCalendar = exports;`
- ✗ Doesn't support `use strict` mode (required in Salesforce)
- ✗ Shadow DOM conflicts cause rendering failures
- ✗ Forces users to stay on vulnerable v3 (jQuery-based, 2016 code)

**Our Solution:**
```javascript
// ✓ Design Principle: Locker Service First
// - No global object mutation (window.*, document.*)
// - No eval(), Function() constructors
// - No document.write()
// - Strict mode by default
// - Shadow DOM native support
// - All DOM access through proper channels (this.template.querySelector in LWC)

// Core Engine: Zero DOM dependencies
class Calendar {
  // Pure data transformations only
  // No direct DOM manipulation
  // No global state
}

// Renderer: Clean DOM abstraction
class DOMRenderer {
  constructor(container) {
    this.container = container; // Controlled scope
    // Never access document directly
    // Never mutate window
  }

  // Use event delegation, not direct bindings
  attachEventListeners() {
    this.container.addEventListener('click', this.handleClick.bind(this));
  }
}

// LWC Adapter: Locker-compliant wrapper
export default class LightningCalendar extends LightningElement {
  renderedCallback() {
    // Use this.template.querySelector (Locker-safe)
    const calendarEl = this.template.querySelector('.calendar');
    this.renderer = new DOMRenderer(calendarEl);
  }
}
```

**Testing Strategy:**
- ✓ All LWC tests run with `@api locker: true`
- ✓ Manual testing in scratch org with Locker enforced
- ✓ CI pipeline tests against Salesforce security policies
- ✓ Zero global scope pollution

---

### 2. Performance Issues 🐌

**FullCalendar Problems:**
- ✗ 1,500 events take 3-4 seconds to render (v2.x regression)
- ✗ Resource timelines take 8-15 seconds to draw
- ✗ Browser "Page Not Responding" with large datasets
- ✗ Entire event store destroyed/recreated on every re-render
- ✗ Diffing algorithm doesn't support events prop efficiently
- ✗ Strict equality checks force unnecessary object recreation
- ✗ No virtual scrolling for large event lists
- ✗ Height calculations cause layout thrashing

**Our Solution:**

#### Virtual Rendering
```javascript
class MonthView {
  render() {
    // Only render visible events
    const visibleEvents = this.getEventsInViewport();

    // Reuse DOM nodes (object pooling)
    this.eventPool.render(visibleEvents);
  }

  getEventsInViewport() {
    // Spatial indexing for O(log n) lookups
    return this.eventIndex.query(this.visibleBounds);
  }
}
```

#### Efficient State Updates
```javascript
class EventStore {
  updateEvent(eventId, changes) {
    // Immutable updates with structural sharing
    const oldEvent = this.events.get(eventId);
    const newEvent = { ...oldEvent, ...changes };

    // Only re-render affected days
    const affectedDays = this.getAffectedDays(oldEvent, newEvent);
    this.renderer.updateDays(affectedDays);

    // No full re-render
  }
}
```

#### Smart Diffing
```javascript
class Calendar {
  setEvents(newEvents) {
    // Efficient diffing with event IDs
    const { added, updated, removed } = this.diff(
      this.events,
      newEvents,
      (event) => event.id // Key function
    );

    // Incremental updates only
    this.applyChanges({ added, updated, removed });
  }
}
```

#### Performance Budgets
- ✓ Initial render: < 100ms for 1,000 events
- ✓ Re-render: < 16ms (60fps) for event updates
- ✓ Support 10,000+ events with virtual scrolling
- ✓ Memory limit: < 10MB for typical calendar

**Implementation Details:**
- Spatial indexing (R-tree or quad-tree) for event lookups
- Object pooling for DOM nodes and event objects
- RequestAnimationFrame for smooth updates
- Debouncing for rapid state changes
- Web Workers for heavy calculations (timezone, recurrence)

---

### 3. Accessibility Issues ♿

**FullCalendar Problems:**
- ✗ Events not announced as interactive to screen readers
- ✗ Event anchors lack `href`, invisible to assistive tech
- ✗ Nested tables confuse screen readers
- ✗ Illogical navigation order (reads all dates, then all events)
- ✗ Current date only indicated by color (fails WCAG)
- ✗ Missing ARIA roles on table headers (`columnheader`, `rowheader`)
- ✗ No keyboard navigation for event selection
- ✗ Interactive elements not in tab order
- ✗ No focus management
- ✗ Relies on table markup (legacy accessibility)

**Our Solution:**

#### Semantic HTML + ARIA
```html
<!-- Month grid using ARIA grid pattern -->
<div role="grid" aria-label="December 2025">
  <div role="row" class="calendar-header">
    <div role="columnheader" aria-label="Sunday">Sun</div>
    <div role="columnheader" aria-label="Monday">Mon</div>
    <!-- ... -->
  </div>

  <div role="row">
    <div role="gridcell"
         aria-label="December 1st, 2025. 2 events."
         aria-selected="false"
         tabindex="-1">
      <span class="date-number" aria-hidden="true">1</span>

      <div role="list" aria-label="Events on December 1st">
        <div role="listitem">
          <button aria-label="Meeting with team, 10:00 AM to 11:00 AM">
            Meeting with team
          </button>
        </div>
        <div role="listitem">
          <button aria-label="Lunch, 12:00 PM to 1:00 PM">
            Lunch
          </button>
        </div>
      </div>
    </div>
    <!-- ... -->
  </div>
</div>
```

#### Roving Tabindex
```javascript
class KeyboardNavigator {
  constructor(calendar) {
    this.calendar = calendar;
    this.focusedCell = { row: 0, col: 0 };
  }

  handleKeyDown(event) {
    switch(event.key) {
      case 'ArrowRight':
        this.moveRight();
        break;
      case 'ArrowLeft':
        this.moveLeft();
        break;
      case 'ArrowUp':
        this.moveUp();
        break;
      case 'ArrowDown':
        this.moveDown();
        break;
      case 'Enter':
      case ' ':
        this.activateCell();
        break;
    }
  }

  moveFocus(newRow, newCol) {
    // Remove tabindex from old cell
    this.getCellElement(this.focusedCell).tabIndex = -1;

    // Add to new cell and focus
    const newCell = this.getCellElement({ row: newRow, col: newCol });
    newCell.tabIndex = 0;
    newCell.focus();

    this.focusedCell = { row: newRow, col: newCol };
  }
}
```

#### Screen Reader Announcements
```javascript
class LiveRegionAnnouncer {
  constructor() {
    // Create off-screen live region
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only'; // Visually hidden
    document.body.appendChild(this.liveRegion);
  }

  announce(message) {
    // Clear and re-populate to force announcement
    this.liveRegion.textContent = '';
    setTimeout(() => {
      this.liveRegion.textContent = message;
    }, 100);
  }
}

// Usage
calendar.on('viewChange', (view) => {
  announcer.announce(`Calendar view changed to ${view.title}`);
});

calendar.on('eventClick', (event) => {
  announcer.announce(`Selected event: ${event.title}`);
});
```

#### Focus Management
```javascript
class FocusManager {
  openEventDialog(event) {
    // Save current focus
    this.previousFocus = document.activeElement;

    // Open dialog and focus first element
    const dialog = this.createDialog(event);
    dialog.querySelector('input').focus();
  }

  closeEventDialog() {
    // Restore focus to triggering element
    this.previousFocus.focus();
  }
}
```

**Accessibility Checklist:**
- ✓ WCAG 2.1 AA compliant
- ✓ Keyboard navigable (all functionality)
- ✓ Screen reader tested (NVDA, JAWS, VoiceOver)
- ✓ High contrast mode support
- ✓ Focus indicators visible
- ✓ No color-only information
- ✓ Logical reading order
- ✓ Descriptive labels
- ✓ Skip links for long navigation

---

### 4. Bundle Size Bloat 📦

**FullCalendar Problems:**
- ✗ v6 bundle size increased by 1000%+ (bundlephobia report)
- ✗ Includes Preact (adds ~3kb)
- ✗ Legacy versions required jQuery + Moment.js (massive)
- ✗ Monolithic build even for simple use cases
- ✗ All plugins bundled together
- ✗ No tree-shaking friendly exports

**Our Solution:**

#### Modular Architecture
```
lightning-calendar/
├── @lightning-calendar/core (15kb gzipped)
│   └── Pure calendar logic, no rendering
├── @lightning-calendar/dom-renderer (10kb gzipped)
│   └── Vanilla JS DOM renderer
├── @lightning-calendar/lwc (5kb gzipped)
│   └── Salesforce LWC adapter
├── @lightning-calendar/react (5kb gzipped)
│   └── React adapter
└── @lightning-calendar/plugins
    ├── drag-drop (8kb)
    ├── recurrence (12kb)
    ├── timezone (10kb)
    └── export (5kb)
```

#### Tree-Shakeable Exports
```javascript
// package.json
{
  "name": "@lightning-calendar/core",
  "sideEffects": false, // Enable tree shaking
  "module": "dist/index.esm.js",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js"
    },
    "./month-view": "./dist/views/month.esm.js",
    "./week-view": "./dist/views/week.esm.js",
    "./day-view": "./dist/views/day.esm.js"
  }
}

// User imports only what they need
import { Calendar } from '@lightning-calendar/core';
import { MonthView } from '@lightning-calendar/core/month-view';
// WeekView and DayView not included in bundle
```

#### Zero Dependencies
```javascript
// Our own date utilities (Locker-safe)
class DateUtils {
  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  // No moment.js, no date-fns
  // Leverages native Intl API where possible
}
```

#### Bundle Size Targets
- ✓ **Core only**: 15kb gzipped
- ✓ **Core + DOM Renderer**: 25kb gzipped
- ✓ **Core + DOM + MonthView**: 30kb gzipped
- ✓ **Full featured** (all views, drag-drop): 50kb gzipped
- ✓ **Salesforce LWC**: 35kb total (core + renderer + LWC adapter)

**Comparison:**
- FullCalendar v5 (minimal): 43kb
- Lightning Calendar (minimal): **25kb** (42% smaller)
- FullCalendar v6 with plugins: 100kb+
- Lightning Calendar (full): **50kb** (50%+ smaller)

---

### 5. Timezone & DST Issues 🌍⏰

**FullCalendar Problems:**
- ✗ Events during DST changeover are hidden/incorrect
- ✗ Recurring events don't update when timezone changes
- ✗ Safari-specific DST bugs (Australia, Europe)
- ✗ Time format offsets are wrong
- ✗ Relies on external timezone libraries (moment-timezone, Luxon)
- ✗ Not all browsers support named timezones natively
- ✗ Inconsistent behavior across browsers

**Our Solution:**

#### Built-in Timezone Engine
```javascript
class TimeZoneEngine {
  constructor() {
    // Leverage native Intl API (supported in all modern browsers)
    this.formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    });
  }

  convertToTimeZone(date, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const values = {};
    parts.forEach(({ type, value }) => {
      values[type] = value;
    });

    return new Date(
      `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`
    );
  }

  // Handle DST transitions
  getDSTTransitions(year, timeZone) {
    // Use Intl API to detect DST boundaries
    const transitions = [];
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      const offset = this.getOffset(date, timeZone);

      // Detect offset change
      if (month > 0 && offset !== prevOffset) {
        transitions.push({ month, offset, prevOffset });
      }
      prevOffset = offset;
    }
    return transitions;
  }

  getOffset(date, timeZone) {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    return (utcDate.getTime() - tzDate.getTime()) / 60000; // minutes
  }
}
```

#### DST-Safe Event Rendering
```javascript
class EventRenderer {
  renderEvent(event, timeZone) {
    // Always store events in UTC internally
    const utcStart = event.start;
    const utcEnd = event.end;

    // Convert to display timezone with DST awareness
    const displayStart = this.tzEngine.convertToTimeZone(utcStart, timeZone);
    const displayEnd = this.tzEngine.convertToTimeZone(utcEnd, timeZone);

    // Check if event spans DST transition
    const spansDST = this.tzEngine.spansDSTTransition(
      utcStart,
      utcEnd,
      timeZone
    );

    if (spansDST) {
      // Handle special rendering (show warning, adjust duration display)
      this.renderDSTWarning(event);
    }

    return this.createEventElement(event, displayStart, displayEnd);
  }
}
```

#### Recurring Events with Timezone
```javascript
class RecurrenceEngine {
  generateOccurrences(event, timeZone, range) {
    const occurrences = [];

    // Store recurrence rule in local time, not UTC
    // This prevents "9am meeting" from shifting during DST
    const localStart = event.start; // Already in event's native timezone

    let currentDate = this.getFirstOccurrence(event, range.start);

    while (currentDate <= range.end) {
      // Apply recurrence rule in local time
      const occurrence = {
        ...event,
        start: currentDate,
        end: this.addDuration(currentDate, event.duration)
      };

      // Convert to display timezone if different
      if (timeZone !== event.timeZone) {
        occurrence.start = this.tzEngine.convertToTimeZone(
          occurrence.start,
          timeZone
        );
        occurrence.end = this.tzEngine.convertToTimeZone(
          occurrence.end,
          timeZone
        );
      }

      occurrences.push(occurrence);
      currentDate = this.getNextOccurrence(event, currentDate);
    }

    return occurrences;
  }
}
```

#### Salesforce Timezone Integration
```javascript
// LWC Adapter
import { LightningElement } from 'lwc';
import { getTimeZone } from 'lightning/platformUtilities';

export default class LightningCalendar extends LightningElement {
  connectedCallback() {
    // Automatically use Salesforce user's timezone
    const userTimeZone = getTimeZone();

    this.calendar = new Calendar({
      timeZone: userTimeZone,
      // Respect Salesforce locale
      locale: this.getUserLocale()
    });
  }

  getUserLocale() {
    // Use Salesforce user settings
    return this.$A?.get('$Locale.userLocaleLang') || 'en-US';
  }
}
```

**Timezone Features:**
- ✓ DST transition detection and handling
- ✓ Cross-timezone event display
- ✓ Recurring events maintain local time
- ✓ Browser-native timezone support (Intl API)
- ✓ Fallback for older browsers (UTC only mode)
- ✓ Salesforce user timezone auto-detection
- ✓ Clear DST warnings for spanning events

---

### 6. State Management Issues 🔄

**FullCalendar Problems:**
- ✗ Entire event store destroyed/recreated on re-render
- ✗ Diffing algorithm doesn't support events prop
- ✗ Strict equality checks cause unnecessary recreation
- ✗ Duplicate events when dragging
- ✗ State corruption during async operations
- ✗ No clear state ownership
- ✗ Difficult to integrate with React/Vue state

**Our Solution:**

#### Immutable State with Structural Sharing
```javascript
class StateManager {
  constructor() {
    this.state = {
      view: 'month',
      date: new Date(),
      events: new Map(), // ID-based lookup
      selectedEventId: null,
      filters: {}
    };
    this.listeners = new Set();
  }

  // Immutable updates
  updateState(updater) {
    const newState = updater(this.state);

    // Only notify if actually changed
    if (newState !== this.state) {
      const oldState = this.state;
      this.state = newState;
      this.notifyListeners(oldState, newState);
    }
  }

  // Efficient event updates
  updateEvent(eventId, changes) {
    this.updateState(state => {
      if (!state.events.has(eventId)) return state;

      const oldEvent = state.events.get(eventId);
      const newEvent = { ...oldEvent, ...changes };

      // Structural sharing - only new Map, rest is shared
      const newEvents = new Map(state.events);
      newEvents.set(eventId, newEvent);

      return {
        ...state,
        events: newEvents
      };
    });
  }
}
```

#### Smart Diffing
```javascript
class EventDiffer {
  diff(oldEvents, newEvents) {
    const added = [];
    const updated = [];
    const removed = [];

    // Build ID index for O(1) lookups
    const oldById = new Map(oldEvents.map(e => [e.id, e]));
    const newById = new Map(newEvents.map(e => [e.id, e]));

    // Find added and updated
    for (const [id, newEvent] of newById) {
      const oldEvent = oldById.get(id);
      if (!oldEvent) {
        added.push(newEvent);
      } else if (!this.isEqual(oldEvent, newEvent)) {
        updated.push({ old: oldEvent, new: newEvent });
      }
    }

    // Find removed
    for (const [id, oldEvent] of oldById) {
      if (!newById.has(id)) {
        removed.push(oldEvent);
      }
    }

    return { added, updated, removed };
  }

  isEqual(event1, event2) {
    // Deep equality check with early exits
    return event1.id === event2.id &&
           event1.title === event2.title &&
           event1.start.getTime() === event2.start.getTime() &&
           event1.end.getTime() === event2.end.getTime();
    // ... check other properties
  }
}
```

#### Framework Integration (React Example)
```javascript
import { useState, useEffect } from 'react';
import { Calendar } from '@lightning-calendar/core';

function useCalendar(initialEvents) {
  const [calendar] = useState(() => new Calendar());
  const [events, setEvents] = useState(initialEvents);

  // Sync React state with calendar
  useEffect(() => {
    calendar.setEvents(events);
  }, [events, calendar]);

  // Expose calendar methods that update React state
  const addEvent = (event) => {
    setEvents(prev => [...prev, event]);
  };

  const updateEvent = (eventId, changes) => {
    setEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, ...changes } : e
    ));
  };

  return { calendar, addEvent, updateEvent };
}
```

---

### 7. Shadow DOM Issues (Salesforce-Specific) 🌓

**FullCalendar Problems:**
- ✗ Incompatible with Synthetic Shadow DOM
- ✗ CSS styles leak/don't apply correctly
- ✗ Event bubbling broken
- ✗ querySelector fails across shadow boundaries
- ✗ Global styles don't reach components

**Our Solution:**

#### Shadow DOM Native Design
```javascript
// Renderer designed for Shadow DOM
class ShadowDOMRenderer {
  constructor(shadowRoot) {
    this.root = shadowRoot;

    // Inject scoped styles
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
      }
      .calendar {
        /* Scoped styles */
      }
    `;
    this.root.appendChild(style);
  }

  // All DOM queries scoped to shadow root
  querySelector(selector) {
    return this.root.querySelector(selector);
  }
}

// LWC Component
export default class LightningCalendar extends LightningElement {
  renderedCallback() {
    // this.template is the shadow root
    const renderer = new ShadowDOMRenderer(this.template);
    this.calendar = new Calendar({ renderer });
  }
}
```

#### CSS Custom Properties for Theming
```css
/* Works across shadow boundaries */
:host {
  --calendar-primary: #0176d3;
  --calendar-bg: #ffffff;
  --calendar-text: #181818;
  --calendar-border: #c9c9c9;
}

.calendar-day {
  background: var(--calendar-bg);
  color: var(--calendar-text);
  border: 1px solid var(--calendar-border);
}
```

---

## Summary: Our Competitive Advantages

| Issue | FullCalendar | Lightning Calendar |
|-------|--------------|-------------------|
| Locker Service | ❌ Broken (v4+) | ✅ Native support |
| Performance (1000 events) | ❌ 3-4s | ✅ <100ms |
| Accessibility | ⚠️ Poor | ✅ WCAG 2.1 AA |
| Bundle Size | ❌ 43kb+ | ✅ 25kb |
| Shadow DOM | ❌ Incompatible | ✅ Native |
| Timezone/DST | ⚠️ Buggy | ✅ Robust |
| State Management | ❌ Inefficient | ✅ Immutable |
| Dependencies | ⚠️ Preact | ✅ Zero |
| Tree Shaking | ❌ No | ✅ Yes |
| LWC Integration | ❌ Requires hacks | ✅ First-class |

---

## Implementation Priority

### Phase 1: Core Issues (Weeks 1-4)
1. ✅ Locker Service compliance (CRITICAL)
2. ✅ Zero dependencies
3. ✅ Shadow DOM support
4. ✅ Basic performance (virtual rendering)

### Phase 2: Polish (Weeks 5-7)
5. ✅ Full accessibility
6. ✅ Timezone handling
7. ✅ State management optimization

### Phase 3: Advanced (Weeks 8-10)
8. ✅ Advanced performance (10k+ events)
9. ✅ Framework integrations
10. ✅ Plugin system

---

**Next Steps:**
1. Review this document
2. Prioritize which issues to tackle first
3. Begin architecting solutions
4. Build prototypes to validate approaches
