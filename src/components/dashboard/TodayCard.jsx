import { AlertCircle, CalendarDays, Utensils } from "lucide-react"

export default function TodayCard({
    events = [],
    tasks = [],
    dinner,
    onOpenEvents,
    onOpenTasks,
    onOpenDinner,
}) {
    const primaryEvent = events[0]
    const primaryTask = tasks[0]

    function getPrimaryEventSubtitle(event) {
        const time =
            event.time_label ||
            event.timeLabel ||
            event.start_time ||
            event.startTime

        const formattedTime = formatTime(time)

        if (formattedTime && event.subtitle) {
            return `${formattedTime} • ${event.subtitle}`
        }

        if (formattedTime) {
            return formattedTime
        }

        return event.subtitle || "Scheduled today"
    }

    function formatTime(timeString) {
        if (!timeString) return ""

        if (timeString.includes("AM") || timeString.includes("PM")) {
            return timeString
        }

        const [hours, minutes] = timeString.split(":")
        if (!hours || !minutes) return timeString

        const date = new Date()
        date.setHours(Number(hours), Number(minutes), 0, 0)

        return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })
    }

    return (
        <section className="eg-card">
            <h2 className="eg-section-title">Today</h2>

            <div className="eg-story-list">
                <button className="eg-story-row" onClick={onOpenEvents}>
                    <CalendarDays size={22} strokeWidth={2} />

                    <div>
                        <strong>
                            {primaryEvent
                                ? primaryEvent.title
                                : "No events today"}
                        </strong>

                        <small>
                            {primaryEvent
                                ? getPrimaryEventSubtitle(primaryEvent)
                                : "No scheduled events"}
                        </small>

                        {events.length > 1 && (
                            <div className="eg-more-items">
                                +{events.length - 1} more today
                            </div>
                        )}
                    </div>
                </button>

                <button className="eg-story-row" onClick={onOpenTasks}>
                    <AlertCircle size={22} strokeWidth={2} />

                    <div>
                        <strong>
                            {primaryTask
                                ? primaryTask.title
                                : "Nothing needs attention"}
                        </strong>

                        <small>
                            {primaryTask
                                ? "Due today"
                                : "You're clear for now"}
                        </small>

                        {tasks.length > 1 && (
                            <div className="eg-more-items">
                                +{tasks.length - 1} more tasks
                            </div>
                        )}
                    </div>
                </button>

                <button className="eg-story-row" onClick={onOpenDinner}>
                    <Utensils size={22} strokeWidth={2} />

                    <div>
                        <strong>
                            {dinner?.meal_name || "Dinner not planned"}
                        </strong>

                        <small>Dinner tonight</small>
                    </div>
                </button>
            </div>
        </section>
    )
}