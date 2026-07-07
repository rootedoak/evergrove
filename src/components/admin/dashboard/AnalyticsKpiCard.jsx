import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight
} from "lucide-react"

export default function AnalyticsKpiCard({
    title,
    value,
    subtitle,
    trend,
    trendDirection = "neutral"
}) {
    const Icon =
        trendDirection === "up"
            ? ArrowUpRight
            : trendDirection === "down"
                ? ArrowDownRight
                : ArrowRight

    return (
        <div className="analytics-kpi-card">
            <div className="analytics-kpi-title">
                {title}
            </div>

            <div className="analytics-kpi-value">
                {value}
            </div>

            {(trend || subtitle) && (
                <div className="analytics-kpi-footer">

                    {trend && (
                        <div
                            className={`analytics-kpi-trend ${trendDirection}`}
                        >
                            <Icon size={15} />

                            {trend}
                        </div>
                    )}

                    {subtitle && (
                        <span>
                            {subtitle}
                        </span>
                    )}

                </div>
            )}
        </div>
    )
}