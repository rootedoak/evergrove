import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import Button from "../ui/Button"

export default function AssistantCard({
    suggestions = [],
    onAddTask,
}) {
    const primarySuggestion = suggestions?.[0]
    const [tasks, setTasks] = useState([])

    useEffect(() => {
        if (!primarySuggestion?.tasks) return

        setTasks(
            primarySuggestion.tasks.map((title, index) => ({
                id: `${index}-${title}`,
                title,
                selected: true
            }))
        )
    }, [primarySuggestion])

    if (!primarySuggestion) return null

    async function handleAddSelected() {
        const selectedTasks = tasks.filter(task => task.selected && task.title.trim())

        for (const task of selectedTasks) {
            await onAddTask(task.title.trim())
        }
    }

    return (
        <section className="eg-card eg-assistant-card">
            <div className="eg-assistant-icon">
                <Sparkles size={22} strokeWidth={2.25} />
            </div>

            <div className="eg-stack">
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
                </div>

                {tasks.length > 0 && (
                    <div className="eg-assistant-task-picker">
                        {tasks.map(task => (
                            <label key={task.id} className="eg-assistant-task-option">
                                <input
                                    type="checkbox"
                                    checked={task.selected}
                                    onChange={event =>
                                        setTasks(current =>
                                            current.map(item =>
                                                item.id === task.id
                                                    ? { ...item, selected: event.target.checked }
                                                    : item
                                            )
                                        )
                                    }
                                />

                                <input
                                    value={task.title}
                                    onChange={event =>
                                        setTasks(current =>
                                            current.map(item =>
                                                item.id === task.id
                                                    ? { ...item, title: event.target.value }
                                                    : item
                                            )
                                        )
                                    }
                                />
                            </label>
                        ))}

                        <Button
                            type="button"
                            size="sm"
                            onClick={handleAddSelected}
                            disabled={!tasks.some(task => task.selected && task.title.trim())}
                        >
                            Add Selected To-Dos
                        </Button>
                    </div>
                )}
            </div>
        </section>
    )
}