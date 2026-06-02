import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { getFamilyMembers } from "../services/familyService"
import { createTask } from "../services/taskService"
import {
    createTrip,
    deleteTrip,
    updateTrip
} from "../services/tripService"
import {
    createTripPlan,
    deleteTripPlan,
    getTripPlans
} from "../services/tripPlanService"

import useTasks from "../hooks/useTasks"
import useTrips from "../hooks/useTrips"

const initialForm = {
    name: "",
    destination: "",
    start_date: "",
    end_date: "",
    notes: ""
}

const initialPlanForm = {
    title: "",
    category: "Other",
    notes: ""
}

const planCategories = [
    "Food",
    "Activity",
    "Lodging",
    "Travel",
    "Packing",
    "Other"
]

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

function getCountdownLabel(trip) {
    const daysUntil = getDaysUntil(trip.start_date)

    if (daysUntil === null) return "Date TBD"
    if (daysUntil < 0) return "Past trip"
    if (daysUntil === 0) return "Starts today"
    if (daysUntil === 1) return "Starts tomorrow"

    return `${daysUntil} days away`
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

function normalizeTrip(trip) {
    return {
        name: trip.name || "",
        destination: trip.destination || "",
        start_date: trip.start_date || "",
        end_date: trip.end_date || "",
        notes: trip.notes || ""
    }
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
    const [editingTripId, setEditingTripId] = useState(null)

    const [form, setForm] = useState(initialForm)
    const [selectedMembers, setSelectedMembers] = useState([])

    const [expandedTripId, setExpandedTripId] = useState(null)
    const [tripPlansByTripId, setTripPlansByTripId] = useState({})
    const [loadingPlansForTripId, setLoadingPlansForTripId] = useState(null)
    const [planForm, setPlanForm] = useState(initialPlanForm)
    const [savingPlan, setSavingPlan] = useState(false)

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

    function getChecklistProgress(trip) {
        const checklistTasks = getTripChecklistTasks(trip.id)
        const completeCount = checklistTasks.filter(
            task => task.status === "complete"
        ).length

        return {
            total: checklistTasks.length,
            complete: completeCount,
            open: checklistTasks.length - completeCount
        }
    }

    function resetForm() {
        setForm({ ...initialForm })
        setSelectedMembers([])
        setEditingTripId(null)
        setShowForm(false)
    }

    function startAddTrip() {
        setForm({ ...initialForm })
        setSelectedMembers([])
        setEditingTripId(null)
        setShowForm(true)
    }

    function startEditTrip(trip) {
        setForm(normalizeTrip(trip))
        setSelectedMembers(
            trip.trip_family_members
                ?.map(attendee => attendee.family_member_id)
                .filter(Boolean) || []
        )
        setEditingTripId(trip.id)
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    async function loadTripPlans(tripId) {
        setLoadingPlansForTripId(tripId)

        try {
            const plans = await getTripPlans(tripId)

            setTripPlansByTripId(current => ({
                ...current,
                [tripId]: plans
            }))
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not load trip plans.")
        } finally {
            setLoadingPlansForTripId(null)
        }
    }

    async function toggleExpandedTrip(tripId) {
        setExpandedTripId(current => current === tripId ? null : tripId)

        if (!tripPlansByTripId[tripId]) {
            await loadTripPlans(tripId)
        }

        setPlanForm({ ...initialPlanForm })
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)

        const payload = {
            name: form.name.trim(),
            destination: form.destination.trim() || null,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
            notes: form.notes.trim() || null
        }

        try {
            if (editingTripId) {
                await updateTrip(editingTripId, payload, selectedMembers)
            } else {
                await createTrip(payload, selectedMembers)
            }

            resetForm()
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

    async function handleCreatePlan(event, trip) {
        event.preventDefault()

        if (!planForm.title.trim()) return

        setSavingPlan(true)

        try {
            await createTripPlan({
                trip_id: trip.id,
                title: planForm.title.trim(),
                category: planForm.category,
                notes: planForm.notes.trim() || null,
                status: "idea"
            })

            setPlanForm({ ...initialPlanForm })
            await loadTripPlans(trip.id)
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not add plan.")
        } finally {
            setSavingPlan(false)
        }
    }

    async function handleDeletePlan(plan) {
        if (!window.confirm(`Delete "${plan.title}"?`)) return

        try {
            await deleteTripPlan(plan.id)
            await loadTripPlans(plan.trip_id)
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not delete plan.")
        }
    }

    function renderTripPlans(trip) {
        const plans = tripPlansByTripId[trip.id] || []
        const groupedPlans = planCategories.reduce((map, category) => {
            map[category] = plans.filter(plan => plan.category === category)
            return map
        }, {})

        return (
            <div className="trip-plans-panel">
                <div className="trip-section-header">
                    <div>
                        <h4>Ideas & Plans</h4>
                        <p>Restaurants, activities, lodging ideas, packing notes, and loose plans.</p>
                    </div>

                    <span>{plans.length}</span>
                </div>

                {loadingPlansForTripId === trip.id ? (
                    <p>Loading plans...</p>
                ) : plans.length === 0 ? (
                    <p className="dashboard-empty">No ideas or plans added yet.</p>
                ) : (
                    <div className="trip-plan-groups">
                        {planCategories.map(category => {
                            const categoryPlans = groupedPlans[category] || []

                            if (categoryPlans.length === 0) return null

                            return (
                                <div className="trip-plan-group" key={category}>
                                    <p className="card-kicker">{category}</p>

                                    <div className="trip-plan-card-grid">
                                        {categoryPlans.map(plan => (
                                            <div className="trip-plan-card" key={plan.id}>
                                                <div>
                                                    <p className="card-kicker">{plan.category}</p>
                                                    <strong>{plan.title}</strong>

                                                    {plan.notes && <p>{plan.notes}</p>}
                                                </div>

                                                <button
                                                    className="danger-button trip-plan-delete"
                                                    type="button"
                                                    onClick={() => handleDeletePlan(plan)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                <form
                    className="form-grid"
                    onSubmit={event => handleCreatePlan(event, trip)}
                    style={{ marginTop: "1rem" }}
                >
                    <label>
                        Plan / Idea
                        <input
                            value={planForm.title}
                            onChange={event =>
                                setPlanForm({
                                    ...planForm,
                                    title: event.target.value
                                })
                            }
                            placeholder="Ohana breakfast, aquarium, hotel pool..."
                            required
                        />
                    </label>

                    <label>
                        Category
                        <select
                            value={planForm.category}
                            onChange={event =>
                                setPlanForm({
                                    ...planForm,
                                    category: event.target.value
                                })
                            }
                        >
                            {planCategories.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="full-width">
                        Notes
                        <textarea
                            rows="2"
                            value={planForm.notes}
                            onChange={event =>
                                setPlanForm({
                                    ...planForm,
                                    notes: event.target.value
                                })
                            }
                        />
                    </label>

                    <button
                        className="primary-button full-width"
                        type="submit"
                        disabled={savingPlan}
                    >
                        {savingPlan ? "Adding..." : "+ Add Plan"}
                    </button>
                </form>
            </div>
        )
    }

    function renderTripRow(trip) {
        const checklist = getChecklistProgress(trip)
        const hasChecklist = checklist.total > 0

        const attendees = trip.trip_family_members
            ?.map(attendee => attendee.family_members?.name)
            .filter(Boolean)
            .join(", ")

        const plans = tripPlansByTripId[trip.id] || []
        const isExpanded = expandedTripId === trip.id

        return (
            <div className="trip-command-row" key={trip.id}>
                <span className="trip-command-icon">🚗</span>

                <div className="trip-command-main">
                    <strong>{trip.name}</strong>

                    <p>
                        {formatDateRange(trip.start_date, trip.end_date)}
                        {trip.destination ? ` • ${trip.destination}` : ""}
                    </p>

                    <small>{getCountdownLabel(trip)}</small>

                    {attendees && <small>{attendees}</small>}
                    {trip.notes && <small>{trip.notes}</small>}

                </div>

                <div className="trip-command-status">
                    {hasChecklist ? (
                        <span className="status-pill status-neutral">
                            Checklist • {checklist.complete}/{checklist.total} complete
                        </span>
                    ) : (
                        <span className="status-pill status-muted">
                            No checklist
                        </span>
                    )}

                    <span className="status-pill status-muted">
                        Plans • {plans.length}
                    </span>
                </div>

                <div className="trip-command-actions">
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={() => toggleExpandedTrip(trip.id)}
                    >
                        {isExpanded ? "Hide Plans" : "Plans"}
                    </button>

                    {hasChecklist ? (
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => handleViewChecklist(trip)}
                        >
                            Checklist
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
                        className="secondary-button"
                        type="button"
                        onClick={() => startEditTrip(trip)}
                    >
                        Edit
                    </button>

                    <button
                        className="danger-button"
                        type="button"
                        onClick={() => handleDelete(trip)}
                    >
                        Delete
                    </button>
                </div>
                {isExpanded && (
                    <div className="trip-command-expanded">
                        {renderTripPlans(trip)}
                    </div>
                )}
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
                        if (showForm) {
                            resetForm()
                        } else {
                            startAddTrip()
                        }
                    }}
                >
                    {showForm ? "Cancel" : "+ Add Trip"}
                </button>
            </header>

            {showForm && (
                <section className="card form-card">
                    <h3>{editingTripId ? "Edit Trip" : "Add Trip"}</h3>

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
                            {saving
                                ? "Saving..."
                                : editingTripId
                                    ? "Save Changes"
                                    : "Save Trip"}
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