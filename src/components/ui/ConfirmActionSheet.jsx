import {
    AlertTriangle,
    Archive,
    Trash2,
    X
} from "lucide-react"

import Button from "./Button"

export default function ConfirmActionSheet({
    open,
    title,
    itemName,
    message,
    confirmLabel = "Confirm",
    variant = "default",
    saving = false,
    onClose,
    onConfirm
}) {
    if (!open) return null

    const isDanger =
        variant === "danger"

    const Icon =
        isDanger
            ? Trash2
            : variant === "archive"
                ? Archive
                : AlertTriangle

    function handleBackdropClick(event) {
        if (
            event.target ===
            event.currentTarget
        ) {
            onClose()
        }
    }

    return (
        <div
            className="eg-confirm-sheet-backdrop"
            onClick={
                handleBackdropClick
            }
        >
            <section
                className="eg-confirm-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="eg-confirm-sheet-title"
            >
                <div className="eg-confirm-sheet-handle" />

                <div className="eg-confirm-sheet-header">
                    <div
                        className={`eg-confirm-sheet-icon ${isDanger
                                ? "danger"
                                : variant === "archive"
                                    ? "archive"
                                    : ""
                            }`}
                    >
                        <Icon size={21} />
                    </div>

                    <button
                        type="button"
                        className="eg-icon-button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close confirmation"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="eg-confirm-sheet-content">
                    <h2 id="eg-confirm-sheet-title">
                        {title}
                    </h2>

                    {itemName && (
                        <strong className="eg-confirm-sheet-item">
                            {itemName}
                        </strong>
                    )}

                    <p>
                        {message}
                    </p>
                </div>

                <div className="eg-confirm-sheet-actions">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        variant={
                            isDanger
                                ? "danger"
                                : "primary"
                        }
                        onClick={onConfirm}
                        disabled={saving}
                    >
                        {saving
                            ? "Working..."
                            : confirmLabel}
                    </Button>
                </div>
            </section>
        </div>
    )
}