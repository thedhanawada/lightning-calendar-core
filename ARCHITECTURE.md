# Lightning Calendar - Architecture Document

**Status**: Draft
**Last Updated**: 2025-12-14

---

## Vision

Build a modern, lightweight, framework-agnostic calendar library that works seamlessly with Salesforce Lightning platform while being usable in any JavaScript environment.

---

## Design Principles

1. **Framework Agnostic Core** - Pure JavaScript logic with no framework dependencies
2. **Locker Service Compatible** - All Salesforce integrations must work within Locker Service constraints
3. **Modular Architecture** - Users import only what they need
4. **Zero/Minimal Dependencies** - Reduce bundle size and security surface
5. **Performance First** - Optimize for large datasets and frequent re-renders
6. **Extensible** - Plugin architecture for custom behaviors

---

## System Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   ADAPTER LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │   LWC    │  │  React   │  │   Vue    │  │ Vanilla│ │
│  │ Adapter  │  │ Adapter  │  │ Adapter  │  │   JS   │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────────┐
│                  RENDERING LAYER                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  - DOM Manipulation                                 │ │
│  │  - Event Handling                                   │ │
│  │  - View Updates                                     │ │
│  │  - Animation/Transitions                            │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────────┐
│                    CORE ENGINE                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Pure JavaScript - No DOM dependencies              │ │
│  ├────────────────────────────────────────────────────┤ │
│  │  • Date Calculations                                │ │
│  │  • Event Management (CRUD)                          │ │
│  │  • Calendar State Management                        │ │
│  │  • View Logic (Month/Week/Day)                      │ │
│  │  • Recurrence Rules                                 │ │
│  │  • Timezone Handling                                │ │
│  │  • Event Filtering/Sorting                          │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Core Engine Design

### Module Structure

```
src/
├── core/
│   ├── calendar/
│   │   ├── Calendar.js           # Main calendar class
│   │   ├── DateUtils.js          # Date manipulation utilities
│   │   └── TimeZone.js           # Timezone handling
│   ├── events/
│   │   ├── Event.js              # Event model
│   │   ├── EventStore.js         # Event data management
│   │   └── RecurrenceEngine.js   # Recurring event logic
│   ├── views/
│   │   ├── MonthView.js          # Month view logic
│   │   ├── WeekView.js           # Week view logic
│   │   ├── DayView.js            # Day view logic
│   │   └── ListView.js           # List view logic
│   └── state/
│       ├── StateManager.js       # Central state management
│       └── ViewState.js          # View-specific state
```

### Key Abstractions

#### 1. Calendar (Core Class)
```javascript
class Calendar {
  constructor(config) {
    this.state = new StateManager()
    this.eventStore = new EventStore()
    this.currentView = null
  }

  // Public API
  setView(viewType, date)
  addEvent(event)
  updateEvent(eventId, updates)
  removeEvent(eventId)
  getEvents(filters)
  next()
  previous()
  today()
}
```

#### 2. Event Model
```javascript
class Event {
  constructor({
    id,
    title,
    start,
    end,
    allDay,
    recurrence,
    metadata
  })

  // Methods
  isRecurring()
  occursOn(date)
  overlaps(otherEvent)
}
```

#### 3. View Logic (Framework Agnostic)
```javascript
class MonthView {
  constructor(calendar, date) {
    this.calendar = calendar
    this.date = date
  }

  // Pure data - no rendering
  getWeeks()          // Returns array of week data
  getDays()           // Returns array of day data
  getEventsForDay(date)
  getTitle()          // "December 2025"
}
```

---

## Rendering Layer

### Responsibilities
- Take data from Core Engine
- Render to DOM
- Handle user interactions
- Emit events back to Core

### Design Pattern: Renderer Interface

```javascript
class Renderer {
  constructor(container, calendar) {
    this.container = container
    this.calendar = calendar
  }

  // Interface methods
  render(viewData)
  update(changes)
  destroy()

  // Event handlers
  onEventClick(callback)
  onDateClick(callback)
  onEventDrag(callback)
}
```

---

## Adapter Layer

### LWC Adapter (Primary Focus)

```javascript
// lightning-calendar.js (LWC Component)
import { LightningElement, api } from 'lwc';
import { Calendar } from 'c/calendarCore';

export default class LightningCalendar extends LightningElement {
  @api view = 'month';
  @api events = [];

  calendar;

  connectedCallback() {
    this.calendar = new Calendar({
      view: this.view,
      events: this.events
    });
    this.renderCalendar();
  }

  // LWC-specific methods
  handleEventClick(event) {
    this.dispatchEvent(new CustomEvent('eventclick', {
      detail: event
    }));
  }
}
```

### Locker Service Constraints
- No `eval()` or `Function()` constructors
- No `document.write()`
- Restricted DOM traversal (use `this.template.querySelector` in LWC)
- No global object mutation
- Shadow DOM boundaries

---

## Data Flow

### Event Creation Flow
```
User Action (Click date)
  ↓
Adapter captures event
  ↓
Adapter calls Core API: calendar.addEvent(eventData)
  ↓
Core validates & stores event
  ↓
Core updates state
  ↓
Core emits change event
  ↓
Renderer receives update
  ↓
Renderer re-renders affected areas
```

---

## Development Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Core Calendar class
- [ ] Basic Event model
- [ ] MonthView logic (data only, no rendering)
- [ ] DateUtils
- [ ] Unit tests for core

### Phase 2: Vanilla Renderer (Weeks 3-4)
- [ ] Basic DOM renderer
- [ ] Month view rendering
- [ ] Event display
- [ ] Basic interactions (click, navigate)
- [ ] Demo page

### Phase 3: LWC Adapter (Weeks 5-6)
- [ ] LWC component wrapper
- [ ] Locker Service testing
- [ ] Salesforce-specific features
- [ ] Sample Salesforce app
- [ ] Documentation

### Phase 4: Enhanced Features (Weeks 7-8)
- [ ] Week view
- [ ] Day view
- [ ] Drag & drop
- [ ] Event resizing
- [ ] Recurrence support

### Phase 5: Polish & Release (Weeks 9-10)
- [ ] Performance optimization
- [ ] Accessibility (WCAG 2.1)
- [ ] API documentation
- [ ] Examples & tutorials
- [ ] npm publish
- [ ] Salesforce package

---

## Technical Decisions

### Date Handling
**Decision**: Use native JavaScript `Date` object with custom utilities
**Rationale**: Avoid dependencies, Locker Service compatible
**Trade-off**: More code to write, but full control

### State Management
**Decision**: Simple observer pattern, no external library
**Rationale**: Minimal bundle size, framework agnostic
**Trade-off**: Less sophisticated than Redux/MobX, but sufficient

### Styling
**Decision**: CSS custom properties (CSS variables) for theming
**Rationale**: Works in Shadow DOM, Locker Service compatible
**Trade-off**: IE11 support requires fallbacks

### Event System
**Decision**: Custom event emitter (pub/sub)
**Rationale**: Framework agnostic, simple, testable
**Trade-off**: Less feature-rich than EventEmitter3, but lighter

---

## Performance Considerations

1. **Virtual Scrolling** - For list views with many events
2. **Event Pooling** - Reuse event objects to reduce GC pressure
3. **Debounced Rendering** - Batch multiple state changes
4. **Lazy Loading** - Load only visible month data
5. **Memoization** - Cache expensive calculations (week boundaries, etc.)

---

## Testing Strategy

### Core Engine
- **Unit Tests**: Jest/Mocha for all pure functions
- **Coverage Target**: 90%+

### Renderers
- **Integration Tests**: Test DOM output
- **Visual Regression**: Percy/Chromatic

### LWC Adapter
- **Jest Tests**: LWC testing library
- **Salesforce Org Testing**: Manual testing in scratch org
- **Locker Service**: Test with Security enforced

---

## API Design (Draft)

### Initialization
```javascript
import { Calendar } from 'lightning-calendar';

const calendar = new Calendar({
  view: 'month',
  date: new Date(),
  events: [...],
  config: {
    firstDay: 0, // Sunday
    timeZone: 'America/New_York',
    locale: 'en-US'
  }
});
```

### Event Management
```javascript
// Add event
calendar.addEvent({
  title: 'Meeting',
  start: new Date('2025-12-15T10:00:00'),
  end: new Date('2025-12-15T11:00:00')
});

// Update event
calendar.updateEvent('event-id', {
  title: 'Updated Meeting'
});

// Remove event
calendar.removeEvent('event-id');

// Query events
const events = calendar.getEvents({
  start: new Date('2025-12-01'),
  end: new Date('2025-12-31')
});
```

### Navigation
```javascript
calendar.next();      // Next month/week/day
calendar.previous();  // Previous month/week/day
calendar.today();     // Jump to today
calendar.goToDate(new Date('2025-12-25'));
```

### Views
```javascript
calendar.setView('month');
calendar.setView('week');
calendar.setView('day');
```

### Events/Callbacks
```javascript
calendar.on('eventClick', (event) => {
  console.log('Clicked event:', event);
});

calendar.on('dateClick', (date) => {
  console.log('Clicked date:', date);
});

calendar.on('viewChange', (view) => {
  console.log('Changed to:', view);
});
```

---

## Open Questions

1. **Timezone Library**: Use Intl API or small library like date-fns-tz?
2. **Accessibility**: ARIA labels strategy for dynamic content?
3. **i18n**: Built-in or leave to consumer?
4. **Recurrence**: Full iCalendar RRULE support or simplified?
5. **Bundle Strategy**: Single bundle vs separate core/adapters?

---

## Success Metrics

### Technical
- Bundle size < 50KB (core + vanilla renderer, gzipped)
- Render 1000 events in < 100ms
- Lighthouse score > 90
- Test coverage > 90%

### Adoption
- 100+ npm downloads/week within 3 months
- 10+ Salesforce orgs using it within 6 months
- 50+ GitHub stars within 6 months

---

## Future Considerations

- Resource scheduling (timeline view)
- Drag & drop between external sources
- Print support
- Export (iCal, Google Calendar)
- Mobile touch gestures
- Real-time collaboration
- Server-side rendering support
