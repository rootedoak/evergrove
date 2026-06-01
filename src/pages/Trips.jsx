import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { getFamilyMembers } from "../services/familyService"
import { createTask } from "../services/taskService"
import { createTrip, deleteTrip } from "../services/tripService"

import useTasks from "../hooks/useTasks"
import useTrips from "../hooks/useTrips"

const initialForm = {
    name: "",
    destination: "",
    start_date: "",
    end_date: "",
    notes: ""
}

function createLocalDate(dateString) {
    if (!dateString) return null

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day)
}

function getTodayString() {
    const today = new Date()

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-")
}

function getDaysUntil(dateString) {
    if (!dateString) return null

    const today = createLocalDate(getTodayString())
    const target = createLocalDate(dateString)

    return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function formatDate(dateString) {
    if (!dateString) return ""

    return createLocalDate(dateString).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    })
}

function formatDateRange(startDate, endDate) {
    if (startDate && endDate && startDate !== endDate) {
        return `${formatDate(startDate)} - ${formatDate(endDate)}`
    }

    if (startDate) return formatDate(startDate)
    return "No date set"
}

function groupTrips(trips) {
    const groups = {
        upcoming: [],
        later: [],
        past: [],
        unscheduled: []
    }

    trips.forEach(trip => {
        const daysUntil = getDaysUntil(trip.start_date)

        if (daysUntil === null) {
            groups.unscheduled.push(trip)
            return
        }

        if (daysUntil < 0) {
            groups.past.push(trip)
            return
        }

        if (daysUntil <= 30) {
            groups.upcoming.push(trip)
            return
        }

        groups.later.push(trip)
    })

    return groups
}

function sortTrips(trips) {
    return [...trips].sort((a, b) => {
        if (!a.start_date && !b.start_date) return a.name.localeCompare(b.name)
        if (!a.start_date) return 1
        if (!b.start_date) return -1

        return createLocalDate(a.start_date) - createLocalDate(b.start_date)
    })
}

function TripSection({
    title,
    subtitle,
    trips,
    emptyText,
    renderTripRow
}) {
    return (
        <section className="trip-command-section">
            <div className="trip-section-header">
                <div>
                    <h3>{title}</h3>
                    {subtitle && <p>{subtitle}</p>}
                </div>

                <span>{trips.length}</span>
            </div>

            {trips.length === 0 ? (
                <p className="dashboard-empty">{emptyText}</p>
            ) : (
                <div className="trip-command-list">
                    {trips.map(trip => renderTripRow(trip))}
                </div>
            )}
        </section>
    )
}

export default function Trips() {
    const navigate = useNavigate()

    const { trips, loading, refreshTrips } = useTrips()
    const { tasks, refreshTasks } = useTasks()

    const [familyMembers, setFamilyMembers] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState(initialForm)
    const [selectedMembers, setSelectedMembers] = useState([])

    const groupedTrips = useMemo(() => {
        return groupTrips(sortTrips(trips))
    }, [trips])

    const activeTripCount =
        groupedTrips.upcoming.length +
        groupedTrips.later.length +
        groupedTrips.unscheduled.length

    useEffect(() => {
        async function loadMembers() {
            try {
                const data = await getFamilyMembers()
                setFamilyMembers(data)
            } catch (error) {
                console.error(error)
            }
        }

        loadMembers()
    }, [])

    function toggleMember(memberId) {
        setSelectedMembers(current =>
            current.includes(memberId)
                ? current.filter(id => id !== memberId)
                : [...current, memberId]
        )
    }

    function getTripChecklistTasks(tripId) {
        return tasks.filter(task => task.trip_id === tripId)
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)

        try {
            await createTrip(
                {
                    name: form.name.trim(),
                    destination: form.destination.trim() || null,
                    start_date: form.start_date,
                    end_date: form.end_date || null,
                    notes: form.notes.trim() || null
                },
                selectedMembers
            )

            setForm({ ...initialForm })
            setSelectedMembers([])
            setShowForm(false)

            await refreshTrips()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not save trip.")
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(trip) {
        if (!window.confirm(`Delete "${trip.name}"?`)) return

        try {
            await deleteTrip(trip.id)
            await refreshTrips()
            await refreshTasks()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not delete trip.")
        }
    }

    async function handleCreateChecklist(trip) {
        const existingChecklistTasks = getTripChecklistTasks(trip.id)

        if (existingChecklistTasks.length > 0) {
            navigate(`/tasks?tripId=${trip.id}`)
            return
        }

        const checklistItems = [
            "Pack clothes",
            "Pack toiletries",
            "Charge tablets and devices",
            "Confirm lodging or reservations",
            "Pack snacks and drinks",
            "Review departure time"
        ]

        try {
            await Promise.all(
                checklistItems.map(title =>
                    createTask({
                        title,
                        description: `Trip checklist item for ${trip.name}.`,
                        due_date: trip.start_date,
                        status: "open",
                        trip_id: trip.id
                    })
                )
            )

            await refreshTasks()
            navigate(`/tasks?tripId=${trip.id}`)
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not create checklist.")
        }
    }

    function handleViewChecklist(trip) {
        navigate(`/tasks?tripId=${trip.id}`)
    }

    function renderTripRow(trip) {
        const checklistTasks = getTripChecklistTasks(trip.id)
        const hasChecklist = checklistTasks.length > 0
        const openChecklistCount = checklistTasks.filter(
            task => task.status !== "complete"
        ).length

        const attendees = trip.trip_family_members
            ?.map(attendee => attendee.family_members?.name)
            .filter(Boolean)
            .join(", ")

        return (
            <div className="trip-command-row" key={trip.id}>
                <span className="trip-command-icon">🚗</span>

                <div className="trip-command-main">
                    <strong>{trip.name}</strong>

                    <p>
                        {formatDateRange(trip.start_date, trip.end_date)}
                        {trip.destination ? ` • ${trip.destination}` : ""}
                    </p>

                    {attendees && <small>{attendees}</small>}

                    {trip.notes && <small>{trip.notes}</small>}
                </div>

                <div className="trip-command-status">
                    {hasChecklist ? (
                        <span className="status-pill status-neutral">
                            Checklist • {openChecklistCount} open
                        </span>
                    ) : (
                        <span className="status-pill status-muted">
                            No checklist
                        </span>
                    )}
                </div>

                <div className="trip-command-actions">
                    {hasChecklist ? (
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => handleViewChecklist(trip)}
                        >
                            View Checklist
                        </button>
                    ) : (
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => handleCreateChecklist(trip)}
                        >
                            Create Checklist
                        </button>
                    )}

                    <button
                        className="danger-button"
                        type="button"
                        onClick={() => handleDelete(trip)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="trips-command-page">
            <header className="calendar-header trips-command-header">
                <div>
                    <p className="dashboard-household-name">Trips</p>
                    <h2>Family Trips</h2>

                    <p className="trips-header-summary">
                        {activeTripCount} active • {groupedTrips.upcoming.length} upcoming •{" "}
                        {groupedTrips.past.length} past
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                        setShowForm(current => !current)

                        if (!showForm) {
                            setForm({ ...initialForm })
                            setSelectedMembers([])
                        }
                    }}
                >
                    {showForm ? "Cancel" : "+ Add Trip"}
                </button>
            </header>

            {showForm && (
                <section className="card form-card">
                    <h3>Add Trip</h3>

                    <form className="form-grid" onSubmit={handleSubmit}>
                        <label>
                            Trip Name
                            <input
                                value={form.name}
                                onChange={event =>
                                    setForm({
                                        ...form,
                                        name: event.target.value
                                    })
                                }
                                placeholder="Summer vacation"
                                required
                            />
                        </label>

                        <label>
                            Destination
                            <input
                                value={form.destination}
                                onChange={event =>
                                    setForm({
                                        ...form,
                                        destination: event.target.value
                                    })
                                }
                                placeholder="Dallas, TX"
                            />
                        </label>

                        <label>
                            Start Date
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={event =>
                                    setForm({
                                        ...form,
                                        start_date: event.target.value
                                    })
                                }
                                required
                            />
                        </label>

                        <label>
                            End Date
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={event =>
                                    setForm({
                                        ...form,
                                        end_date: event.target.value
                                    })
                                }
                            />
                        </label>

                        <div className="full-width trip-member-picker">
                            <strong>Who's Going?</strong>

                            <div className="trip-member-grid">
                                {familyMembers.map(member => (
                                    <label
                                        className={
                                            selectedMembers.includes(member.id)
                                                ? "trip-member-chip selected"
                                                : "trip-member-chip"
                                        }
                                        key={member.id}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedMembers.includes(member.id)}
                                            onChange={() => toggleMember(member.id)}
                                        />

                                        <span>
                                            {member.avatar_emoji || "👤"} {member.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <label className="full-width">
                            Notes
                            <textarea
                                rows="3"
                                value={form.notes}
                                onChange={event =>
                                    setForm({
                                        ...form,
                                        notes: event.target.value
                                    })
                                }
                            />
                        </label>

                        <button
                            className="primary-button full-width"
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Trip"}
                        </button>
                    </form>
                </section>
            )}

            <section className="card trips-command-card">
                {loading ? (
                    <p>Loading trips...</p>
                ) : trips.length === 0 ? (
                    <p className="dashboard-empty">No trips planned yet.</p>
                ) : (
                    <>
                        <TripSection
                            title="Upcoming"
                            subtitle="Trips coming up in the next 30 days."
                            trips={groupedTrips.upcoming}
                            emptyText="No trips coming up soon."
                            renderTripRow={renderTripRow}
                        />

                        <TripSection
                            title="Later"
                            subtitle="Future travel plans."
                            trips={groupedTrips.later}
                            emptyText="No later trips."
                            renderTripRow={renderTripRow}
                        />

                        <TripSection
                            title="Unscheduled"
                            subtitle="Saved without a date."
                            trips={groupedTrips.unscheduled}
                            emptyText="No unscheduled trips."
                            renderTripRow={renderTripRow}
                        />

                        {groupedTrips.past.length > 0 && (
                            <TripSection
                                title="Past"
                                subtitle="Completed trips."
                                trips={groupedTrips.past}
                                emptyText="No past trips."
                                renderTripRow={renderTripRow}
                            />
                        )}
                    </>
                )}
            </section>
        </div>
    )
}