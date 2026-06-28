export default function BottomSheet({ open, onClose, children }) {
    if (!open) return null

    return (
        <div className="eg-bottom-sheet-backdrop" onClick={onClose}>
            <div className="eg-bottom-sheet" onClick={(event) => event.stopPropagation()}>
                <div className="eg-sheet-handle" />
                {children}
            </div>
        </div>
    )
}