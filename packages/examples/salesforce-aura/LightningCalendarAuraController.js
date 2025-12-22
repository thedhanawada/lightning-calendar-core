({
    /**
     * Component initialization
     */
    doInit: function(component, event, helper) {
        // Load initial events if on a record page
        if (component.get("v.recordId")) {
            helper.loadRecordEvents(component);
        }
    },

    /**
     * Initialize calendar after library loads
     */
    initializeCalendar: function(component, event, helper) {
        // Get the calendar container
        const container = component.find("calendarContainer").getElement();

        // Create calendar instance using the loaded library
        const calendar = new window.LightningCalendar.Calendar();

        // Create renderer
        const renderer = new window.LightningCalendar.VanillaDOMRenderer(container, calendar);

        // Store instances
        component.set("v.calendar", calendar);
        component.set("v.renderer", renderer);

        // Set up event listeners
        calendar.on('eventClick', function(event) {
            helper.handleEventClick(component, event);
        });

        calendar.on('dateClick', function(date) {
            helper.handleDateClick(component, date);
        });

        // Load events from Salesforce
        helper.loadSalesforceEvents(component);

        // Add sample events for demo
        helper.addSampleEvents(component);
    },

    /**
     * Navigation controls
     */
    goToToday: function(component, event, helper) {
        const calendar = component.get("v.calendar");
        if (calendar) {
            calendar.today();
        }
    },

    goPrevious: function(component, event, helper) {
        const calendar = component.get("v.calendar");
        if (calendar) {
            calendar.previous();
        }
    },

    goNext: function(component, event, helper) {
        const calendar = component.get("v.calendar");
        if (calendar) {
            calendar.next();
        }
    },

    /**
     * View switching
     */
    setMonthView: function(component, event, helper) {
        helper.setView(component, 'month');
    },

    setWeekView: function(component, event, helper) {
        helper.setView(component, 'week');
    },

    setDayView: function(component, event, helper) {
        helper.setView(component, 'day');
    },

    /**
     * Event handling
     */
    handleAddEvent: function(component, event, helper) {
        component.set("v.showEventModal", true);
    },

    closeEventModal: function(component, event, helper) {
        component.set("v.showEventModal", false);
    },

    saveEvent: function(component, event, helper) {
        // Get form values
        const title = component.find("eventTitle").get("v.value");
        const start = component.find("eventStart").get("v.value");
        const end = component.find("eventEnd").get("v.value");
        const description = component.find("eventDescription").get("v.value");

        if (title && start && end) {
            // Create event object
            const newEvent = {
                id: 'event-' + Date.now(),
                title: title,
                start: new Date(start),
                end: new Date(end),
                description: description,
                color: '#0070f3'
            };

            // Add to calendar
            const calendar = component.get("v.calendar");
            if (calendar) {
                calendar.addEvent(newEvent);
            }

            // Save to Salesforce (call Apex)
            helper.saveSalesforceEvent(component, newEvent);

            // Close modal
            component.set("v.showEventModal", false);

            // Show success toast
            helper.showToast('Success', 'Event created successfully', 'success');
        } else {
            helper.showToast('Error', 'Please fill all required fields', 'error');
        }
    }
})