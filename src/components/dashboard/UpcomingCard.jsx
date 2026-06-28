import { CalendarDays, ChevronRight } from "lucide-react"

export default function UpcomingCard({
    events = [],
    onOpenCalendar,
}) {

    const upcoming = events.slice(0, 3)

    return (
        <section className="eg-card">

            <div className="eg-row-between">

                <h2 className="eg-section-title">
                    Coming Up
                </h2>

                <button
                    className="eg-text-button"
                    onClick={onOpenCalendar}
                >
                    Calendar
                </button>

            </div>

            {upcoming.length === 0 ? (

                <p className="eg-empty-text">
                    Nothing coming up this week.
                </p>

            ) : (

                <div className="eg-story-list">

                    {upcoming.map(item => (

                        <button
                            key={item.id}
                            className="eg-story-row"
                            onClick={onOpenCalendar}
                        >

                            <CalendarDays
                                size={20}
                                strokeWidth={2}
                            />

                            <div className="eg-story-content">

                                <strong>
                                    {item.title}
                                </strong>

                                <small>
                                    {item.subtitle}
                                </small>

                            </div>

                            <ChevronRight
                                size={18}
                            />

                        </button>

                    ))}

                </div>

            )}

        </section>
    )
}