({
    /**
     * Load events from Salesforce
     */
    loadSalesforceEvents: function(component) {
        // Call Apex controller to get events
        const action = component.get("c.getEvents");

        action.setCallback(this, function(response) {
            const state = response.getState();
            if (state === "SUCCESS") {
                const events = response.getReturnValue();
                const calendar = component.get("v.calendar");

                if (calendar && events) {
                    // Transform Salesforce events to calendar format
                    const calendarEvents = events.map(function(sfEvent) {
                        return {
                            id: sfEvent.Id,
                            title: sfEvent.Subject,
                            start: new Date(sfEvent.StartDateTime),
                            end: new Date(sfEvent.EndDateTime),
                            allDay: sfEvent.IsAllDayEvent,
                            description: sfEvent.Description,
                            color: this.getEventColor(sfEvent.Type),
                            metadata: {
                                recordId: sfEvent.Id,
                                type: 'Event'
                            }
                        };
                    }.bind(this));

                    calendar.setEvents(calendarEvents);
                    component.set("v.events", calendarEvents);
                }
            } else {
                this.handleError(response.getError());
            }
        });

        $A.enqueueAction(action);
    },

    /**
     * Load events related to current record
     */
    loadRecordEvents: function(component) {
        const recordId = component.get("v.recordId");
        if (!recordId) return;

        const action = component.get("c.getRecordEvents");
        action.setParams({ recordId: recordId });

        action.setCallback(this, function(response) {
            if (response.getState() === "SUCCESS") {
                // Process events
                this.processEvents(component, response.getReturnValue());
            }
        });

        $A.enqueueAction(action);
    },

    /**
     * Add sample events for demo purposes
     */
    addSampleEvents: function(component) {
        const calendar = component.get("v.calendar");
        if (!calendar) return;

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sampleEvents = [
            {
                id: 'demo-1',
                title: 'Team Standup',
                start: new Date(today.setHours(9, 0, 0, 0)),
                end: new Date(today.setHours(9, 30, 0, 0)),
                color: '#0070f3',
                recurring: true,
                recurrenceRule: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR'
            },
            {
                id: 'demo-2',
                title: 'Client Presentation',
                start: new Date(today.setHours(14, 0, 0, 0)),
                end: new Date(today.setHours(15, 30, 0, 0)),
                color: '#00c853'
            },
            {
                id: 'demo-3',
                title: 'Project Deadline',
                start: tomorrow,
                end: tomorrow,
                allDay: true,
                color: '#ff6b6b'
            }
        ];

        sampleEvents.forEach(event => calendar.addEvent(event));
    },

    /**
     * Handle event click
     */
    handleEventClick: function(component, event) {
        if (event.metadata && event.metadata.recordId) {
            // Navigate to record
            const navEvent = $A.get("e.force:navigateToSObject");
            navEvent.setParams({
                "recordId": event.metadata.recordId
            });
            navEvent.fire();
        } else {
            // Show event details
            this.showToast('Event Details', event.title + ' - ' + event.description, 'info');
        }
    },

    /**
     * Handle date click
     */
    handleDateClick: function(component, date) {
        // Could open event creation modal with pre-filled date
        console.log('Date clicked:', date);
    },

    /**
     * Save event to Salesforce
     */
    saveSalesforceEvent: function(component, event) {
        const action = component.get("c.createEvent");
        action.setParams({
            subject: event.title,
            startDateTime: event.start.toISOString(),
            endDateTime: event.end.toISOString(),
            description: event.description
        });

        action.setCallback(this, function(response) {
            if (response.getState() === "SUCCESS") {
                // Reload events
                this.loadSalesforceEvents(component);
            } else {
                this.handleError(response.getError());
            }
        });

        $A.enqueueAction(action);
    },

    /**
     * Set calendar view
     */
    setView: function(component, viewType) {
        const calendar = component.get("v.calendar");
        if (calendar) {
            calendar.setView(viewType);
            component.set("v.currentView", viewType);
        }
    },

    /**
     * Get color based on event type
     */
    getEventColor: function(eventType) {
        const colors = {
            'Meeting': '#0070f3',
            'Call': '#00c853',
            'Email': '#ff9800',
            'Task': '#9c27b0',
            'Other': '#666666'
        };
        return colors[eventType] || '#0070f3';
    },

    /**
     * Show toast message
     */
    showToast: function(title, message, type) {
        const toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            "title": title,
            "message": message,
            "type": type
        });
        toastEvent.fire();
    },

    /**
     * Handle errors
     */
    handleError: function(errors) {
        let message = 'Unknown error';
        if (errors && Array.isArray(errors) && errors.length > 0) {
            message = errors[0].message;
        }
        this.showToast('Error', message, 'error');
    }
})