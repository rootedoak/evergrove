import SectionCard from "../ui/SectionCard"
import TimelineRow from "../ui/TimelineRow"
import DateBadge from "../ui/DateBadge"

export default function CalendarAgenda({
    loading,
    agendaEventsByDate,
    formatAgendaDateLabel,
    onSelectEvent,
}) {
    return (
        <SectionCard
            title="Family Timeline"
            subtitle="Everything coming up for your household."
        >
            {loading ? (
                <p>Loading calendar...</p>
            ) : Object.keys(agendaEventsByDate).length === 0 ? (
                <p className="eg-empty-text">Nothing coming up.</p>
            ) : (
                <div className="eg-calendar-timeline">
                    {Object.entries(agendaEventsByDate).map(([date, events]) => (
                        <div key={date} className="eg-calendar-timeline-day">
                            <DateBadge
                                date={date}
                                label={formatAgendaDateLabel(date)}
                            />

                            <div className="eg-calendar-timeline-events">
                                {events.map(event => (
                                    <TimelineRow
                                        key={event.id}
                                        icon={event.icon}
                                        title={event.title}
                                        subtitle={event.subtitle}
                                        detail={event.location}
                                        meta=""
                                        onClick={() => onSelectEvent(event)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </SectionCard>
    )
}