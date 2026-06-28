import SectionCard from "../ui/SectionCard"

export default function CalendarMonth({
    loading,
    visibleDate,
    monthTitle,
    calendarDays,
    eventsByDate,
    todayString,
    weekdayLabels,
    onPreviousMonth,
    onNextMonth,
    onToday,
    onSelectDate,
}) {
    return (
        <SectionCard
            title={monthTitle}
            subtitle="Month view"
            action={
                <div className="eg-calendar-month-controls">
                    <button type="button" onClick={onPreviousMonth}>‹</button>
                    <button type="button" onClick={onToday}>Today</button>
                    <button type="button" onClick={onNextMonth}>›</button>
                </div>
            }
        >
            {loading ? (
                <p className="eg-empty-text">Loading calendar...</p>
            ) : (
                <div className="eg-calendar-month">
                    {weekdayLabels.map(day => (
                        <div className="eg-calendar-weekday" key={day}>
                            {day}
                        </div>
                    ))}

                    {calendarDays.map(day => {
                        const dayEvents = eventsByDate[day.dateString] || []
                        const isToday = day.dateString === todayString

                        return (
                            <button
                                key={day.dateString}
                                type="button"
                                className={[
                                    "eg-calendar-day",
                                    day.isCurrentMonth ? "" : "muted",
                                    isToday ? "today" : "",
                                    dayEvents.length > 0 ? "has-events" : ""
                                ].join(" ")}
                                onClick={() => onSelectDate(day.dateString)}
                            >
                                <span className="eg-calendar-day-number">
                                    {day.date.getDate()}
                                </span>

                                {dayEvents.length > 0 && (
                                    <div className="eg-calendar-day-dots">
                                        {dayEvents.slice(0, 3).map(event => (
                                            <span key={event.id} />
                                        ))}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </SectionCard>
    )
}