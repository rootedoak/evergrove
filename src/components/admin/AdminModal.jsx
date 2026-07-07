import { X } from "lucide-react"

export default function AdminModal({
    open,
    title,
    children,
    actions,
    onClose,
    width = "600px"
}) {
    if (!open) return null

    return (
        <div
            className="admin-modal-backdrop"
            onClick={onClose}
        >
            <div
                className="admin-modal"
                style={{ maxWidth: width }}
                onClick={event => event.stopPropagation()}
            >
                <div className="admin-modal-header">
                    <h2>{title}</h2>

                    <button
                        className="admin-modal-close"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="admin-modal-body">
                    {children}
                </div>

                {actions && (
                    <div className="admin-modal-footer">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    )
}