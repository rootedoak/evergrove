export default function Reminders() {
    return (
        <div className="reminders-command-page">
            <header className="calendar-header reminders-command-header">
                <div>
                    <p className="dashboard-household-name">Reminders</p>
                    <h2>Family Reminders</h2>

                    <p className="reminders-header-summary">
                        Upcoming alerts, deadlines, events, and overdue tasks.
                    </p>
                </div>
            </header>

            <section className="card reminders-command-card">
                <section className="reminder-command-section">
                    <div className="reminder-section-header">
                        <div>
                            <h3>Coming Soon</h3>
                            <p>
                                Reminders will eventually collect registration alerts,
                                school deadlines, task due dates, and important family dates.
                            </p>
                        </div>

                        <span>0</span>
                    </div>

                    <p className="dashboard-empty">
                        No reminder feed has been built yet.
                    </p>
                </section>
            </section>
        </div>
    )
}