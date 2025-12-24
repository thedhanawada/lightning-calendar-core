# Lightning Calendar UI

Pre-built UI components that work with Lightning Calendar Core.

## What's Here

Production-ready calendar interfaces you can use immediately:

- **LWC** - Salesforce Lightning Web Components
- **HTML** - Vanilla JavaScript + HTML/CSS (framework-agnostic)
- **Shared** - Common styles and utilities

## Choose Your Implementation

Pick the one that fits your stack. They all use the same core engine underneath.

### LWC (Salesforce)
Full SLDS-styled calendar for Salesforce orgs. Deploy and use immediately.

### HTML (Vanilla)
Pure JavaScript + CSS. Works anywhere - static sites, React, Vue, plain HTML.

## Architecture

```
UI Layer (this package)
    ↓
Core Engine (@lightning-calendar/core)
    ↓
Your Data
```

The UI handles rendering and interactions. The core handles logic. You control the data.
