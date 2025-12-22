/**
 * Apex Controller for Lightning Calendar Visualforce Example
 * Demonstrates how to integrate Lightning Calendar Core with Salesforce data
 */
public with sharing class CalendarController {

    /**
     * Get events for the calendar
     * @return List of Events from Salesforce
     */
    @RemoteAction
    public static List<Event> getEvents() {
        // Get events for current user for the next 90 days
        DateTime startDate = DateTime.now().addDays(-30);
        DateTime endDate = DateTime.now().addDays(60);

        return [
            SELECT Id, Subject, StartDateTime, EndDateTime,
                   IsAllDayEvent, Description, Type, OwnerId,
                   Location, WhoId, WhatId
            FROM Event
            WHERE OwnerId = :UserInfo.getUserId()
                AND StartDateTime >= :startDate
                AND StartDateTime <= :endDate
            ORDER BY StartDateTime ASC
            LIMIT 500
        ];
    }

    /**
     * Create a new event
     * @param startDateTime The start date/time for the event
     * @param subject The subject/title of the event
     * @return The created Event Id
     */
    @RemoteAction
    public static String createEvent(String startDateTime, String subject) {
        Event newEvent = new Event();
        newEvent.Subject = subject;
        newEvent.StartDateTime = DateTime.valueOf(startDateTime);
        newEvent.EndDateTime = newEvent.StartDateTime.addHours(1);
        newEvent.OwnerId = UserInfo.getUserId();

        insert newEvent;
        return newEvent.Id;
    }

    /**
     * Update an existing event
     * @param eventId The Id of the event to update
     * @param startDateTime New start date/time
     * @param endDateTime New end date/time
     * @return Success status
     */
    @RemoteAction
    public static Boolean updateEvent(String eventId, String startDateTime, String endDateTime) {
        try {
            Event eventToUpdate = [SELECT Id FROM Event WHERE Id = :eventId LIMIT 1];
            eventToUpdate.StartDateTime = DateTime.valueOf(startDateTime);
            eventToUpdate.EndDateTime = DateTime.valueOf(endDateTime);

            update eventToUpdate;
            return true;
        } catch (Exception e) {
            System.debug('Error updating event: ' + e.getMessage());
            return false;
        }
    }

    /**
     * Delete an event
     * @param eventId The Id of the event to delete
     * @return Success status
     */
    @RemoteAction
    public static Boolean deleteEvent(String eventId) {
        try {
            Event eventToDelete = [SELECT Id FROM Event WHERE Id = :eventId LIMIT 1];
            delete eventToDelete;
            return true;
        } catch (Exception e) {
            System.debug('Error deleting event: ' + e.getMessage());
            return false;
        }
    }

    /**
     * Get Tasks as calendar events
     * @return List of Tasks formatted for calendar display
     */
    @RemoteAction
    public static List<Map<String, Object>> getTasks() {
        List<Map<String, Object>> calendarTasks = new List<Map<String, Object>>();

        List<Task> tasks = [
            SELECT Id, Subject, ActivityDate, Status, Priority,
                   Description, WhoId, WhatId, OwnerId
            FROM Task
            WHERE OwnerId = :UserInfo.getUserId()
                AND IsClosed = false
                AND ActivityDate != null
            ORDER BY ActivityDate ASC
            LIMIT 200
        ];

        for (Task t : tasks) {
            Map<String, Object> calendarTask = new Map<String, Object>();
            calendarTask.put('id', t.Id);
            calendarTask.put('title', t.Subject);
            calendarTask.put('start', t.ActivityDate);
            calendarTask.put('allDay', true);
            calendarTask.put('color', getColorByPriority(t.Priority));
            calendarTask.put('description', t.Description);
            calendarTask.put('type', 'Task');

            calendarTasks.add(calendarTask);
        }

        return calendarTasks;
    }

    /**
     * Helper method to get color based on priority
     */
    private static String getColorByPriority(String priority) {
        Map<String, String> priorityColors = new Map<String, String>{
            'High' => '#ff0000',
            'Normal' => '#0070f3',
            'Low' => '#00c853'
        };

        return priorityColors.get(priority) != null ?
               priorityColors.get(priority) : '#666666';
    }
}