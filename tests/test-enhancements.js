/**
 * Test suite for enhanced search and recurrence features
 * Demonstrates performance improvements and edge case handling
 */

import { EnhancedCalendar } from '../core/integration/EnhancedCalendar.js';
import { SearchWorkerManager } from '../core/search/SearchWorkerManager.js';
import { RecurrenceEngineV2 } from '../core/events/RecurrenceEngineV2.js';
import { EventStore } from '../core/events/EventStore.js';

// Performance test helper
function measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
    return result;
}

// Generate test events
function generateTestEvents(count = 1000) {
    const events = [];
    const categories = ['meeting', 'personal', 'work', 'urgent', 'team'];
    const locations = ['Conference Room A', 'Virtual', 'Office', 'Client Site'];

    for (let i = 0; i < count; i++) {
        const startDate = new Date(2024, 0, 1 + Math.floor(i / 10), 9 + (i % 8), 0);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);

        events.push({
            id: `event-${i}`,
            title: `Event ${i} - ${categories[i % categories.length]}`,
            description: `Description for event ${i} with searchable content`,
            start: startDate,
            end: endDate,
            location: locations[i % locations.length],
            categories: [categories[i % categories.length]],
            recurring: i % 10 === 0, // Every 10th event is recurring
            recurrenceRule: i % 10 === 0 ? 'FREQ=WEEKLY;COUNT=10' : null
        });
    }

    return events;
}

// Test 1: Search Scalability
async function testSearchScalability() {
    console.log('\n=== Test 1: Search Scalability ===');

    const calendar = new EnhancedCalendar({});

    // Add 1000 events
    console.log('Adding 1000 test events...');
    const testEvents = generateTestEvents(1000);
    for (const event of testEvents) {
        calendar.addEvent(event);
    }

    // Test search performance
    console.log('\nSearch Performance:');

    // Simple search
    await measurePerformance('Simple search (100 events)', async () => {
        return await calendar.search('event', { limit: 100 });
    });

    // Fuzzy search
    await measurePerformance('Fuzzy search', async () => {
        return await calendar.search('meetting', { fuzzy: true });
    });

    // Multi-field search
    await measurePerformance('Multi-field search', async () => {
        return await calendar.search('conference', {
            fields: ['title', 'description', 'location']
        });
    });

    // Autocomplete
    await measurePerformance('Autocomplete suggestions', async () => {
        return await calendar.getSuggestions('eve', 'title');
    });

    // Get performance stats
    const stats = calendar.getPerformanceStats();
    console.log('\nPerformance Statistics:');
    console.log('Average search time:', stats.searchTime?.avg?.toFixed(2), 'ms');

    // Test with 10,000 events
    console.log('\n\nScaling to 10,000 events...');
    const moreEvents = generateTestEvents(9000);
    for (const event of moreEvents) {
        calendar.addEvent(event);
    }

    await measurePerformance('Search in 10,000 events', async () => {
        return await calendar.search('urgent', { limit: 50 });
    });

    calendar.destroy();
}

// Test 2: Recurring Event Complexity
async function testRecurringEventComplexity() {
    console.log('\n=== Test 2: Recurring Event Complexity ===');

    const calendar = new EnhancedCalendar({});

    // Test 1: DST Transition Handling
    console.log('\n1. DST Transition Handling:');

    // Event that spans DST transition (March 2024)
    calendar.addEvent({
        id: 'dst-event',
        title: 'Weekly Meeting During DST',
        start: new Date('2024-03-01T14:00:00'),
        end: new Date('2024-03-01T15:00:00'),
        recurring: true,
        recurrenceRule: 'FREQ=WEEKLY;COUNT=5',
        timeZone: 'America/New_York'
    });

    const dstOccurrences = await calendar.getEventsInRange(
        new Date('2024-03-01'),
        new Date('2024-03-31'),
        { handleDST: true }
    );

    console.log(`Found ${dstOccurrences.length} occurrences across DST transition`);
    for (const occ of dstOccurrences) {
        if (occ.recurringEventId === 'dst-event') {
            console.log(`  ${occ.start.toISOString()} - Timezone: ${occ.timezone}`);
        }
    }

    // Test 2: Complex Monthly Patterns
    console.log('\n2. Complex Monthly Patterns:');

    // Last Friday of every month
    calendar.addEvent({
        id: 'last-friday',
        title: 'Monthly Review - Last Friday',
        start: new Date('2024-01-26T09:00:00'), // Last Friday of Jan 2024
        end: new Date('2024-01-26T10:00:00'),
        recurring: true,
        recurrenceRule: 'FREQ=MONTHLY;BYDAY=-1FR;COUNT=12'
    });

    // Second Tuesday of every month
    calendar.addEvent({
        id: 'second-tuesday',
        title: 'Board Meeting - 2nd Tuesday',
        start: new Date('2024-01-09T14:00:00'), // 2nd Tuesday of Jan 2024
        end: new Date('2024-01-09T16:00:00'),
        recurring: true,
        recurrenceRule: 'FREQ=MONTHLY;BYDAY=2TU;COUNT=12'
    });

    const monthlyOccurrences = await calendar.getEventsInRange(
        new Date('2024-01-01'),
        new Date('2024-12-31')
    );

    const lastFridays = monthlyOccurrences.filter(e => e.recurringEventId === 'last-friday');
    const secondTuesdays = monthlyOccurrences.filter(e => e.recurringEventId === 'second-tuesday');

    console.log(`Last Friday meetings: ${lastFridays.length}`);
    console.log(`Second Tuesday meetings: ${secondTuesdays.length}`);

    // Test 3: Modified Instances
    console.log('\n3. Modified Instance Handling:');

    // Create a recurring event
    calendar.addEvent({
        id: 'daily-standup',
        title: 'Daily Standup',
        start: new Date('2024-01-01T09:00:00'),
        end: new Date('2024-01-01T09:15:00'),
        recurring: true,
        recurrenceRule: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;COUNT=20'
    });

    // Modify specific occurrences
    calendar.modifyOccurrence(
        'daily-standup',
        new Date('2024-01-03T09:00:00'),
        {
            title: 'Extended Standup - Sprint Planning',
            end: new Date('2024-01-03T10:00:00'),
            location: 'Large Conference Room'
        }
    );

    calendar.modifyOccurrence(
        'daily-standup',
        new Date('2024-01-10T09:00:00'),
        {
            start: new Date('2024-01-10T10:00:00'), // Moved to 10 AM
            end: new Date('2024-01-10T10:15:00')
        }
    );

    // Cancel an occurrence
    calendar.cancelOccurrence(
        'daily-standup',
        new Date('2024-01-05T09:00:00'),
        'Team Offsite'
    );

    const janOccurrences = await calendar.getEventsInRange(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        { includeModified: true, includeCancelled: true }
    );

    const standups = janOccurrences.filter(e =>
        e.recurringEventId === 'daily-standup' || e.id === 'daily-standup'
    );

    console.log(`Total standup occurrences in January: ${standups.length}`);
    const modified = standups.filter(e => e.isModified);
    const cancelled = standups.filter(e => e.status === 'cancelled');
    console.log(`  Modified: ${modified.length}`);
    console.log(`  Cancelled: ${cancelled.length}`);

    // Test 4: Complex Yearly Patterns
    console.log('\n4. Complex Yearly Patterns:');

    // Event on specific day of year (100th day)
    calendar.addEvent({
        id: 'day-100',
        title: '100th Day Celebration',
        start: new Date('2024-04-09T12:00:00'), // 100th day of 2024
        end: new Date('2024-04-09T13:00:00'),
        recurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYYEARDAY=100;COUNT=5'
    });

    // Event on last day of February (handles leap years)
    calendar.addEvent({
        id: 'feb-end',
        title: 'End of February Review',
        start: new Date('2024-02-29T16:00:00'), // 2024 is leap year
        end: new Date('2024-02-29T17:00:00'),
        recurring: true,
        recurrenceRule: 'FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1;COUNT=5'
    });

    const yearlyOccurrences = await calendar.getEventsInRange(
        new Date('2024-01-01'),
        new Date('2028-12-31')
    );

    const day100Events = yearlyOccurrences.filter(e => e.recurringEventId === 'day-100');
    const febEndEvents = yearlyOccurrences.filter(e => e.recurringEventId === 'feb-end');

    console.log(`100th day events over 5 years: ${day100Events.length}`);
    console.log(`End of February events: ${febEndEvents.length}`);

    // Test 5: Performance with many modifications
    console.log('\n5. Performance with Many Modifications:');

    // Create event with many occurrences
    calendar.addEvent({
        id: 'perf-test',
        title: 'Performance Test Event',
        start: new Date('2024-01-01T10:00:00'),
        end: new Date('2024-01-01T11:00:00'),
        recurring: true,
        recurrenceRule: 'FREQ=DAILY;COUNT=365'
    });

    // Bulk modify first 100 occurrences
    console.log('Applying bulk modifications...');
    await measurePerformance('Bulk modify 100 occurrences', async () => {
        await calendar.bulkModifyOccurrences(
            'perf-test',
            {
                start: new Date('2024-01-01'),
                end: new Date('2024-04-10')
            },
            {
                location: 'Virtual Meeting Room',
                categories: ['modified', 'virtual']
            }
        );
    });

    // Get occurrences with modifications
    const perfOccurrences = await measurePerformance('Get 365 occurrences with modifications', async () => {
        return await calendar.getEventsInRange(
            new Date('2024-01-01'),
            new Date('2024-12-31'),
            { includeModified: true }
        );
    });

    const perfEvents = perfOccurrences.filter(e => e.recurringEventId === 'perf-test');
    const modifiedPerf = perfEvents.filter(e => e.isModified);
    console.log(`Modified occurrences: ${modifiedPerf.length} of ${perfEvents.length}`);

    calendar.destroy();
}

// Test 3: Edge Cases and Error Handling
async function testEdgeCases() {
    console.log('\n=== Test 3: Edge Cases ===');

    const calendar = new EnhancedCalendar({});

    // Test 1: Events crossing year boundaries
    console.log('\n1. Year Boundary Crossing:');
    calendar.addEvent({
        id: 'nye-party',
        title: 'New Year Eve Party',
        start: new Date('2024-12-31T22:00:00'),
        end: new Date('2025-01-01T02:00:00'),
        recurring: true,
        recurrenceRule: 'FREQ=YEARLY;COUNT=3'
    });

    const nyeOccurrences = await calendar.getEventsInRange(
        new Date('2024-12-30'),
        new Date('2025-01-02')
    );
    console.log(`NYE occurrences found: ${nyeOccurrences.filter(e => e.id === 'nye-party' || e.recurringEventId === 'nye-party').length}`);

    // Test 2: Very frequent recurrence
    console.log('\n2. High-frequency Recurrence:');
    calendar.addEvent({
        id: 'hourly-check',
        title: 'Hourly System Check',
        start: new Date('2024-01-01T00:00:00'),
        end: new Date('2024-01-01T00:05:00'),
        recurring: true,
        recurrenceRule: 'FREQ=HOURLY;INTERVAL=1;COUNT=168' // Every hour for a week
    });

    const hourlyOccurrences = await measurePerformance('Expand 168 hourly occurrences', async () => {
        return await calendar.getEventsInRange(
            new Date('2024-01-01'),
            new Date('2024-01-08')
        );
    });
    console.log(`Hourly occurrences generated: ${hourlyOccurrences.filter(e => e.recurringEventId === 'hourly-check').length}`);

    // Test 3: Complex search with special characters
    console.log('\n3. Special Character Handling:');
    calendar.addEvent({
        id: 'special-chars',
        title: 'Meeting @ HQ w/ CEO & CTO (Important!)',
        description: 'Discuss Q1 goals, $1M budget, 50% growth target',
        start: new Date('2024-01-15T14:00:00'),
        end: new Date('2024-01-15T15:00:00')
    });

    const specialSearch = await calendar.search('CEO & CTO');
    console.log(`Found events with special characters: ${specialSearch.length}`);

    // Test 4: Timezone edge cases
    console.log('\n4. Timezone Edge Cases:');

    // Event in timezone that doesn't observe DST
    calendar.addEvent({
        id: 'arizona-event',
        title: 'Arizona Meeting (No DST)',
        start: new Date('2024-03-10T14:00:00'), // Day of DST change
        end: new Date('2024-03-10T15:00:00'),
        recurring: true,
        recurrenceRule: 'FREQ=DAILY;COUNT=3',
        timeZone: 'America/Phoenix' // Arizona doesn't observe DST
    });

    // Event in UTC
    calendar.addEvent({
        id: 'utc-event',
        title: 'UTC Coordination Call',
        start: new Date('2024-03-10T14:00:00Z'),
        end: new Date('2024-03-10T15:00:00Z'),
        recurring: true,
        recurrenceRule: 'FREQ=DAILY;COUNT=3',
        timeZone: 'UTC'
    });

    const tzOccurrences = await calendar.getEventsInRange(
        new Date('2024-03-09'),
        new Date('2024-03-13')
    );

    console.log('Arizona events:', tzOccurrences.filter(e => e.recurringEventId === 'arizona-event').length);
    console.log('UTC events:', tzOccurrences.filter(e => e.recurringEventId === 'utc-event').length);

    calendar.destroy();
}

// Test 4: Import/Export with Enhanced Features
async function testImportExport() {
    console.log('\n=== Test 4: Import/Export ===');

    const calendar1 = new EnhancedCalendar({});

    // Create complex calendar data
    calendar1.addEvent({
        id: 'export-test',
        title: 'Recurring with Modifications',
        start: new Date('2024-01-01T10:00:00'),
        end: new Date('2024-01-01T11:00:00'),
        recurring: true,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=12'
    });

    // Add modifications and exceptions
    calendar1.modifyOccurrence(
        'export-test',
        new Date('2024-01-03T10:00:00'),
        { title: 'Modified Title', location: 'Room 101' }
    );

    calendar1.cancelOccurrence(
        'export-test',
        new Date('2024-01-08T10:00:00'),
        'Public Holiday'
    );

    // Export
    console.log('Exporting calendar with recurrence data...');
    const exported = calendar1.exportWithRecurrence('json');
    console.log(`Exported data size: ${exported.length} bytes`);

    // Import to new calendar
    const calendar2 = new EnhancedCalendar({});
    console.log('Importing to new calendar...');
    calendar2.importWithRecurrence(exported, 'json');

    // Verify import
    const importedEvents = await calendar2.getEventsInRange(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        { includeModified: true, includeCancelled: true }
    );

    const importedOccurrences = importedEvents.filter(e =>
        e.recurringEventId === 'export-test' || e.id === 'export-test'
    );

    console.log(`Imported occurrences: ${importedOccurrences.length}`);
    console.log(`Modified: ${importedOccurrences.filter(e => e.isModified).length}`);
    console.log(`Cancelled: ${importedOccurrences.filter(e => e.status === 'cancelled').length}`);

    calendar1.destroy();
    calendar2.destroy();
}

// Run all tests
async function runAllTests() {
    console.log('========================================');
    console.log('   Enhanced Calendar Feature Tests');
    console.log('========================================');

    await testSearchScalability();
    await testRecurringEventComplexity();
    await testEdgeCases();
    await testImportExport();

    console.log('\n========================================');
    console.log('   All Tests Completed Successfully');
    console.log('========================================');
}

// Export test suite
export {
    testSearchScalability,
    testRecurringEventComplexity,
    testEdgeCases,
    testImportExport,
    runAllTests
};

// Run tests if executed directly
if (typeof process !== 'undefined' && process.argv[1] === import.meta.url) {
    runAllTests().catch(console.error);
}