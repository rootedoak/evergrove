import { useEffect, useState } from "react"
import { X } from "lucide-react"
import Button from "../ui/Button"
import {
    getBirthdayEventDetail,
    saveBirthdayEventDetail
} from "../../services/birthdayEventDetailService"

export default function BirthdayDetailSheet({ member, event, open, onClose }) {
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open || !member || !event) return

        async function loadDetail() {
            setLoading(true)

            try {
                const detail = await getBirthdayEventDetail({
                    familyMemberId: member.id,
                    occurrenceDate: event.date
                })

                setNotes(detail?.notes || "")
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        loadDetail()
    }, [open, member, event])

    if (!open || !member || !event) return null

    async function handleSave() {
        setSaving(true)

        try {
            await saveBirthdayEventDetail({
                familyMemberId: member.id,
                occurrenceDate: event.date,
                notes
            })

            onClose()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not save birthday notes.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="eg-bottom-sheet-backdrop" onClick={onClose}>
            <div className="eg-bottom-sheet" onClick={event => event.stopPropagation()}>
                <div className="eg-sheet-handle" />

                <div className="eg-sheet-header">
                    <div>
                        <h3>🎂 {member.name}'s Birthday</h3>
                        <div className="birthday-sheet-subtitle">
                            <p>{event.date}</p>
                            <small>Automatically generated from your Family profile.</small>
                        </div>
                    </div>

                    <button type="button" className="eg-icon-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="birthday-detail-stack">
                    <p className="muted-text">
                        These notes are just for this year's celebration.
                    </p>

                    <label>
                        This Year's Notes
                        <textarea
                            rows={5}
                            value={notes}
                            onChange={event => setNotes(event.target.value)}
                            placeholder="Cake ideas, gifts to remember, party plans, who to invite..."
                            disabled={loading}
                        />
                    </label>

                    <Button type="button" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Notes"}
                    </Button>
                </div>
            </div>
        </div>
    )
}