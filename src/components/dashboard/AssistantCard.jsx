import { Sparkles } from "lucide-react"

export default function AssistantCard({
    suggestions = [],
    onAddTask,
}) {
    const primarySuggestion = suggestions?.[0]

    if (!primarySuggestion) return null

    return (
        <section className="eg-card eg-assistant-card">
            <div className="eg-assistant-icon">
                <Sparkles size={22} strokeWidth={2.25} />
            </div>

            <div>
                <h2 className="eg-section-title">Evergrove Assistant</h2>

                <h3 className="eg-assistant-title">
                    {primarySuggestion.title}
                </h3>

                {primarySuggestion.description && (
                    <p className="eg-assistant-copy">
                        {primarySuggestion.description}
                    </p>
                )}

                {Array.isArray(primarySuggestion.tasks) && primarySuggestion.tasks.length > 0 && (
                    <div className="eg-assistant-actions">
                        {primarySuggestion.tasks.slice(0, 3).map(taskTitle => (
                            <button
                                key={taskTitle}
                                type="button"
                                onClick={() => onAddTask(taskTitle)}
                            >
                                + {taskTitle}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}