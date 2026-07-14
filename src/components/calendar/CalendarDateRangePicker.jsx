import { useEffect, useState } from "react"
import { CalendarDays, X } from "lucide-react"
import { DayPicker } from "@daypicker/react"

import "@daypicker/react/style.css"

function createLocalDate(dateString) {
    if (!dateString) return undefined

    const [year, month, day] = dateString
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day)
}

function formatDateString(date) {
    if (!date) return ""

    const year = date.getFullYear()
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0")

    const day = String(
        date.getDate()
    ).padStart(2, "0")

    return `${year}-${month}-${day}`
}

function formatDisplayDate(dateString) {
    if (!dateString) return ""

    return createLocalDate(dateString)
        .toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
        })
}

export default function CalendarDateRangePicker({
    startDate,
    endDate,
    onChange
}) {
    const [open, setOpen] = useState(false)

    const [draftRange, setDraftRange] =
        useState(undefined)

    useEffect(() => {
        if (!open) return

        const from = createLocalDate(startDate)
        const to = createLocalDate(
            endDate || startDate
        )

        setDraftRange(
            from
                ? {
                    from,
                    to
                }
                : undefined
        )
    }, [open, startDate, endDate])

    function handleApply() {
        if (!draftRange?.from) return

        const nextStartDate =
            formatDateString(draftRange.from)

        const nextEndDate =
            formatDateString(
                draftRange.to ||
                draftRange.from
            )

        onChange({
            startDate: nextStartDate,
            endDate: nextEndDate
        })

        setOpen(false)
    }

    const displayValue = startDate
        ? endDate &&
            endDate !== startDate
            ? `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
            : formatDisplayDate(startDate)
        : "Choose dates"

    return (
        <>
            <label className="full-width">
                Dates

                <button
                    type="button"
                    className="calendar-range-trigger"
                    onClick={() => setOpen(true)}
                >
                    <span>{displayValue}</span>

                    <CalendarDays
                        size={18}
                        aria-hidden="true"
                    />
                </button>
            </label>

            {open && (
                <div
                    className="eg-bottom-sheet-backdrop"
                    onClick={() => setOpen(false)}
                >
                    <section
                        className="eg-bottom-sheet calendar-range-sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Select event dates"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >
                        <div className="eg-sheet-handle" />

                        <div className="eg-sheet-header">
                            <div>
                                <h3>Select dates</h3>

                                <p>
                                    Choose the first and last
                                    day of the event.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="eg-icon-button"
                                onClick={() =>
                                    setOpen(false)
                                }
                                aria-label="Close date picker"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="calendar-range-calendar">
                            <DayPicker
                                mode="range"
                                selected={draftRange}
                                onSelect={setDraftRange}
                                defaultMonth={
                                    draftRange?.from ||
                                    createLocalDate(startDate) ||
                                    new Date()
                                }
                                numberOfMonths={1}
                            />
                        </div>

                        <div className="calendar-range-summary">
                            <div>
                                <span>Starts</span>

                                <strong>
                                    {draftRange?.from
                                        ? draftRange.from
                                            .toLocaleDateString()
                                        : "Select a date"}
                                </strong>
                            </div>

                            <div>
                                <span>Ends</span>

                                <strong>
                                    {draftRange?.to
                                        ? draftRange.to
                                            .toLocaleDateString()
                                        : draftRange?.from
                                            ? "Select an end date"
                                            : "Select a date"}
                                </strong>
                            </div>
                        </div>

                        <div className="calendar-range-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                    setOpen(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="primary-button"
                                disabled={!draftRange?.from}
                                onClick={handleApply}
                            >
                                Done
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    )
}