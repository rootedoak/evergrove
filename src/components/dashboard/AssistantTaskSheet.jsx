import { useEffect, useState } from "react"
import { X } from "lucide-react"

import Button from "../ui/Button"
import FormActions from "../ui/FormActions"

export default function AssistantTaskSheet({
    open,
    insight,
    onClose,
    onAddSelected
}) {
    const [tasks, setTasks] = useState([])

    useEffect(() => {
        if (!open || !insight?.taskOptions) return

        setTasks(
            insight.taskOptions.map((title, index) => ({
                id: `${index}-${title}`,
                title,
                selected: true
            }))
        )
    }, [open, insight?.id])

    if (!open || !insight) return null

    const selectedTasks = tasks
        .filter(task => task.selected && task.title.trim())
        .map(task => task.title.trim())

    const selectedCount = selectedTasks.length

    return (
        <div className="eg-bottom-sheet-backdrop" onClick={onClose}>
            <div
                className="eg-bottom-sheet"
                onClick={event => event.stopPropagation()}
            >
                <div className="eg-sheet-handle" />

                <div className="eg-sheet-header">
                    <div>
                        <h3>Review Suggested To-Dos</h3>
                        <p>{insight.title}</p>
                    </div>

                    <button
                        type="button"
                        className="eg-icon-button"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="eg-stack">
                    <div className="eg-insight-task-picker">
                        {tasks.map(task => (
                            <label
                                key={task.id}
                                className="eg-insight-task-option"
                            >
                                <input
                                    type="checkbox"
                                    checked={task.selected}
                                    onChange={event =>
                                        setTasks(current =>
                                            current.map(item =>
                                                item.id === task.id
                                                    ? {
                                                        ...item,
                                                        selected: event.target.checked
                                                    }
                                                    : item
                                            )
                                        )
                                    }
                                />

                                <input
                                    type="text"
                                    value={task.title}
                                    onChange={event =>
                                        setTasks(current =>
                                            current.map(item =>
                                                item.id === task.id
                                                    ? {
                                                        ...item,
                                                        title: event.target.value
                                                    }
                                                    : item
                                            )
                                        )
                                    }
                                />
                            </label>
                        ))}
                    </div>

                    <FormActions>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            disabled={selectedCount === 0}
                            onClick={() => onAddSelected(selectedTasks)}
                        >
                            {selectedCount === 1
                                ? "Add 1 Selected To-Do"
                                : `Add ${selectedCount} Selected To-Dos`}
                        </Button>
                    </FormActions>
                </div>
            </div>
        </div>
    )
}