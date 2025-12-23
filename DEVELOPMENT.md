# Development Guide

## Project Structure

This is a monorepo with a single source of truth for the core calendar engine.

```
lightning-calendar/
├── packages/
│   ├── core/                    ← Main product (source of truth)
│   │   └── src/core/            ← Edit core here ONLY
│   └── examples/
│       └── salesforce-lwc/      ← Salesforce LWC implementation
│           └── .../core/        ← Synced copy (don't edit directly)
├── demo/                        ← Web demo
└── scripts/
    └── sync-lwc-core.sh        ← Sync script
```

## Core Development Workflow

### 1. Develop Core Features

Edit files in `packages/core/src/core/` only:

```bash
# Example: Add a new feature to the calendar
vi packages/core/src/core/calendar/Calendar.js
```

### 2. Sync to Salesforce LWC

Before deploying to Salesforce, sync the core:

```bash
npm run sync:lwc
```

This copies `packages/core/src/core/` to the LWC component.

### 3. Deploy to Salesforce

```bash
npm run deploy:lwc
```

This command:
1. Syncs the core (`npm run sync:lwc`)
2. Deploys to Salesforce org

## Important Rules

### ✓ DO
- Edit core files in `packages/core/src/core/` only
- Run `npm run sync:lwc` before deploying to Salesforce
- Commit synced LWC files along with core changes

### ✗ DON'T
- Edit files in `packages/examples/salesforce-lwc/.../core/` directly
- Forget to sync before deploying to Salesforce
- Commit core changes without syncing LWC

## CI/CD

GitHub Actions will check that LWC core is in sync with main core on every push.

If you see a CI failure:
1. Run `npm run sync:lwc`
2. Commit the synced files
3. Push again

## Available Commands

```bash
npm run build           # Build all packages
npm run sync:lwc        # Sync core to LWC
npm run deploy:lwc      # Sync + deploy to Salesforce
npm run demo            # Run web demo
npm run test            # Run tests
```

## Salesforce Deployment

The LWC component automatically includes the synced core. No additional configuration needed.

When you deploy to Salesforce, the LWC will have all the latest core features:
- Timezone support
- Conflict detection
- Performance optimizations
- Enhanced event model
- Recurrence engine
