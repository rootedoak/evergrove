import { CheckCircle2, Sparkles } from "lucide-react"
import Button from "../ui/Button"

export default function InsightCard({
    insight,
    onAction,
    completedInsight,
}) {

    if (!insight && !completedInsight) return null

    const isComplete = Boolean(completedInsight)
    const activeInsight = completedInsight || insight

    return (
        <section className={`eg-card eg-insight-card ${isComplete ? "complete" : ""}`}>
            <div className="eg-insight-icon">
                {isComplete ? (
                    <CheckCircle2 size={22} />
                ) : (
                    <Sparkles size={22} />
                )}
            </div>

            <div className="eg-insight-content">
                <h2 className="eg-section-title">Evergrove Insight</h2>

                <h3>
                    {isComplete
                        ? activeInsight.completedTitle || "Done"
                        : activeInsight.title}
                </h3>

                <p>
                    {isComplete
                        ? activeInsight.completedDescription || "Evergrove handled that for you."
                        : activeInsight.description}
                </p>

                {isComplete ? (
                    activeInsight.completedActionLabel && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => activeInsight.onCompletedAction?.()}
                        >
                            {activeInsight.completedActionLabel}
                        </Button>
                    )
                ) : (
                    activeInsight.actionLabel && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onAction?.(activeInsight)}
                        >
                            {activeInsight.taskOptions?.length
                                ? "Review Suggested To-Dos"
                                : activeInsight.actionLabel}
                        </Button>
                    )
                )}
            </div>
        </section>
    )
}