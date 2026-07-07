import Button from "../ui/Button"
import AdminStatusChip from "./AdminStatusChip"

export default function AdminRelationshipCard({
    title,
    primary,
    secondary,
    status,
    statusLabel,
    empty = false,
    emptyLabel = "Not linked",
    actionLabel,
    onClick
}) {
    return (
        <div className="admin-relationship-card">
            <p className="admin-relationship-title">
                {title}
            </p>

            {empty ? (
                <p className="admin-relationship-empty">
                    {emptyLabel}
                </p>
            ) : (
                <>
                    <strong>{primary}</strong>

                    {secondary && (
                        <p>{secondary}</p>
                    )}

                    {status && (
                        <div className="admin-relationship-status">
                            <AdminStatusChip status={status}>
                                {statusLabel || status}
                            </AdminStatusChip>
                        </div>
                    )}
                </>
            )}

            {actionLabel && onClick && (
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={onClick}
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}