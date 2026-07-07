import {
    AlertTriangle,
    CheckCircle2,
    Info,
    Lightbulb
} from "lucide-react"

const iconMap = {
    positive: CheckCircle2,
    warning: AlertTriangle,
    idea: Lightbulb,
    neutral: Info
}

export default function AnalyticsInsightCard({
    tone = "neutral",
    title,
    description,
    footer
}) {
    const Icon = iconMap[tone] || Info

    return (
        <div className={`analytics-insight-card ${tone}`}>
            <div className="analytics-insight-icon">
                <Icon size={18} />
            </div>

            <div>
                <h3>{title}</h3>
                <p>{description}</p>

                {footer && (
                    <span>{footer}</span>
                )}
            </div>
        </div>
    )
}