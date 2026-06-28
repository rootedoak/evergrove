import { Plus } from "lucide-react"

export default function FloatingButton({ onClick }) {
    return (
        <button className="eg-fab" onClick={onClick} type="button">
            <Plus size={32} strokeWidth={2.5} />
        </button>
    )
}