import useAnalytics from "../hooks/useAnalytics"

function MetricCard({ label, value }) {
    return (
        <div className="analytics-metric-card">
            <span>{label}</span>
            <strong>{value ?? 0}</strong>
        </div>
    )
}

export default function Analytics() {
    const { metrics, loading, refresh } = useAnalytics(30)

    return (
        <div className="page analytics-page">
            <header className="page-header">
                <div>
                    <p className="card-kicker">Founder Dashboard</p>
                    <h1>Analytics</h1>
                    <p>Last 30 days of Evergrove household activity.</p>
                </div>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={refresh}
                >
                    Refresh
                </button>
            </header>

            {loading ? (
                <p className="muted-text">Loading analytics...</p>
            ) : (
                <div className="analytics-grid">
                    <MetricCard label="Total Events" value={metrics?.totalEvents} />
                    <MetricCard label="Announcements" value={metrics?.announcementsCreated} />
                    <MetricCard label="Tasks Created" value={metrics?.tasksCreated} />
                    <MetricCard label="Tasks Completed" value={metrics?.tasksCompleted} />
                    <MetricCard label="Activities Created" value={metrics?.activitiesCreated} />
                    <MetricCard label="Trips Created" value={metrics?.tripsCreated} />
                    <MetricCard label="Meals Planned" value={metrics?.mealsPlanned} />
                </div>
            )}
        </div>
    )
}