import {
    Plus,
    X
} from "lucide-react"

import BottomSheet from "../ui/BottomSheet"
import Button from "../ui/Button"

import {
    habitTemplates,
    habitTemplateCategories
} from "../../data/habitTemplates"

export default function HabitTemplateSheet({
    open,
    onClose,
    onCreateCustom,
    onSelectTemplate
}) {
    return (
        <BottomSheet
            open={open}
            onClose={onClose}
        >
            <div className="eg-habit-template-sheet">
                <div className="eg-habit-template-sheet__header">
                    <div>
                        <p className="eg-habit-template-sheet__eyebrow">
                            New Habit
                        </p>

                        <h2>
                            Choose a starting point
                        </h2>

                        <p>
                            Pick a template or create your own.
                            You can customize everything before saving.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="eg-habit-template-sheet__close"
                        onClick={onClose}
                        aria-label="Close habit templates"
                    >
                        <X size={20} />
                    </button>
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={onCreateCustom}
                >
                    <Plus size={18} />
                    Create Your Own Habit
                </Button>

                <div className="eg-habit-template-sheet__categories">
                    {habitTemplateCategories.map(category => {
                        const templates =
                            habitTemplates.filter(
                                template =>
                                    template.category === category
                            )

                        if (!templates.length) {
                            return null
                        }

                        return (
                            <section
                                key={category}
                                className="eg-habit-template-category"
                            >
                                <h3>
                                    {category}
                                </h3>

                                <div className="eg-habit-template-list">
                                    {templates.map(template => {
                                        const TemplateIcon = template.icon

                                        return (
                                            <button
                                                key={template.id}
                                                type="button"
                                                className="eg-habit-template-card"
                                                onClick={() =>
                                                    onSelectTemplate(template)
                                                }
                                            >
                                                <span
                                                    className="eg-habit-template-card__icon"
                                                    aria-hidden="true"
                                                >
                                                    <TemplateIcon size={20} />
                                                </span>

                                                <span className="eg-habit-template-card__content">
                                                    <strong>
                                                        {template.name}
                                                    </strong>

                                                    {template.description && (
                                                        <span>
                                                            {template.description}
                                                        </span>
                                                    )}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </section>
                        )
                    })}
                </div>
            </div>
        </BottomSheet>
    )
}