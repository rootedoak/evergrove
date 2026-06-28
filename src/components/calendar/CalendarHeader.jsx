import { Link } from "react-router-dom"

import PageHeader from "../ui/PageHeader"
import Button from "../ui/Button"

export default function CalendarHeader({
    householdName,
    calendarView,
    setCalendarView,
    onAdd,
}) {
    return (
        <>
            <PageHeader
                eyebrow={householdName || "My Household"}
                title="Family Calendar"
                subtitle="Everything coming up for your household."
                action={
                    <Button onClick={onAdd}>
                        + Add
                    </Button>
                }
            />

            <section className="eg-card">
                <div className="eg-calendar-view-toggle">
                    <button
                        type="button"
                        className={calendarView === "agenda" ? "active" : ""}
                        onClick={() => setCalendarView("agenda")}
                    >
                        Timeline
                    </button>

                    <button
                        type="button"
                        className={calendarView === "month" ? "active" : ""}
                        onClick={() => setCalendarView("month")}
                    >
                        Month
                    </button>
                </div>

                <div className="eg-calendar-destinations">
                    <Link to="/trips">
                        <strong>Trips</strong>
                        <span>Travel plans and checklists</span>
                    </Link>

                    <Link to="/school">
                        <strong>School</strong>
                        <span>Forms, dates, and deadlines</span>
                    </Link>
                </div>
            </section>
        </>
    )
}