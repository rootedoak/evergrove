import {
    Activity,
    CalendarDays,
    TrendingUp,
    UserCheck,
    Users,
    Zap
} from "lucide-react"

const iconMap = {
    sessions: Activity,
    dau: UserCheck,
    wau: Users,
    mau: Users,
    sessionsPerUser: TrendingUp,
    activeDays: CalendarDays,
    default: Zap
}

export default function AnalyticsKpiCard({
    title,
    value,
    subtitle,
    trend,
    trendDirection = "neutral",
    icon = "default"
}) {
    const Icon = iconMap[icon] || iconMap.default

    return (
        <div className="analytics-kpi-card">
            <div className="analytics-kpi-main">
                <div className="analytics-kpi-icon">
                    <Icon size={22} />
                </div>

                <div>
                    <p className="analytics-kpi-title">{title}</p>
                    <strong className="analytics-kpi-value">{value}</strong>
                    {subtitle && (
                        <p className="analytics-kpi-subtitle">{subtitle}</p>
                    )}
                </div>
            </div>

            {trend && (
                <div className="analytics-kpi-divider">
                    <span className={`analytics-kpi-trend ${trendDirection}`}>
                        {trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : "—"} {trend}
                    </span>

                    <span className="analytics-kpi-trend-label">
                        vs previous period
                    </span>
                </div>
            )}
        </div>
    )
}