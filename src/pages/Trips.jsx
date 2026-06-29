import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"

import { getFamilyMembers } from "../services/familyService"
import { createTask } from "../services/taskService"
import { createTrip, deleteTrip, updateTrip } from "../services/tripService"
import { createTripPlan, deleteTripPlan, getTripPlans } from "../services/tripPlanService"

import useTasks from "../hooks/useTasks"
import useTrips from "../hooks/useTrips"

import AppPage from "../components/ui/AppPage"
import PageHeader from "../components/ui/PageHeader"
import SectionCard from "../components/ui/SectionCard"
import Button from "../components/ui/Button"
import InsightCard from "../components/dashboard/InsightCard"

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

function TripSection({ title, subtitle, trips, emptyText, renderTripRow }) {
    return (
        <SectionCard
            title={title}
            subtitle={subtitle}
            count={trips.length}
        >
            {trips.length === 0 ? (
                <p className="dashboard-empty">{emptyText}</p>
            ) : (
                <div className="eg-stack">
                    {trips.map(trip => renderTripRow(trip))}
                </div>
            )}
        </SectionCard>
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

    const [tripMenuOpen, setTripMenuOpen] = useState(null)

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

                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    type="button"
                                                    onClick={() => handleDeletePlan(plan)}
                                                >
                                                    Delete
                                                </Button>
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

                    <Button
                        className="full-width"
                        type="submit"
                        disabled={savingPlan}
                    >
                        {savingPlan ? "Adding..." : "+ Add Plan"}
                    </Button>
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

                    {attendees && <small>{attendees}</small>}
                    {trip.notes && <small>{trip.notes}</small>}
                </div>

                <div className="trip-command-status">
                    <span className="status-pill status-primary">
                        {getCountdownLabel(trip)}
                    </span>

                    {hasChecklist && (
                        <span className="status-pill status-neutral">
                            {checklist.complete}/{checklist.total} complete
                        </span>
                    )}

                    {plans.length > 0 && (
                        <span className="status-pill status-muted">
                            {plans.length} plan{plans.length === 1 ? "" : "s"}
                        </span>
                    )}
                </div>

                <div className="trip-command-actions">
                    <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => toggleExpandedTrip(trip.id)}
                    >
                        {isExpanded ? "Hide Plans" : "Plans"}
                    </Button>

                    {hasChecklist ? (
                        <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={() => handleViewChecklist(trip)}
                        >
                            Checklist
                        </Button>
                    ) : (
                        <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={() => handleCreateChecklist(trip)}
                        >
                            Create Checklist
                        </Button>
                    )}

                    <div className="eg-overflow-menu-wrap">
                        <button
                            type="button"
                            className="eg-overflow-button"
                            onClick={() =>
                                setTripMenuOpen(current =>
                                    current === trip.id ? null : trip.id
                                )
                            }
                            aria-label="Open trip actions"
                        >
                            ⋮
                        </button>

                        {tripMenuOpen === trip.id && (
                            <div
                                className="task-action-backdrop"
                                onClick={() => setTripMenuOpen(null)}
                            >
                                <div
                                    className="task-action-sheet"
                                    onClick={event => event.stopPropagation()}
                                >
                                    <h3>{trip.name}</h3>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTripMenuOpen(null)
                                            startEditTrip(trip)
                                        }}
                                    >
                                        Edit Trip
                                    </button>

                                    <button
                                        type="button"
                                        className="danger"
                                        onClick={() => {
                                            setTripMenuOpen(null)
                                            handleDelete(trip)
                                        }}
                                    >
                                        Delete Trip
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTripMenuOpen(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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
        <AppPage>
            <PageHeader
                eyebrow="Trips"
                title="Family Trips"
                subtitle={`${activeTripCount} active • ${groupedTrips.upcoming.length} upcoming • ${groupedTrips.past.length} past`}
                action={
                    <Button
                        size="sm"
                        onClick={() => {
                            if (showForm) {
                                resetForm()
                            } else {
                                startAddTrip()
                            }
                        }}
                    >
                        <Plus size={16} />
                        {showForm ? "Cancel" : "Add"}
                    </Button>
                }
            />

            <div className="eg-stack">
                <InsightCard
                    insight={{
                        title:
                            groupedTrips.upcoming.length > 0
                                ? `${groupedTrips.upcoming[0].name} is ${getCountdownLabel(groupedTrips.upcoming[0]).toLowerCase()}`
                                : "No upcoming trips",
                        description:
                            groupedTrips.upcoming.length > 0
                                ? "Review your checklist and plans before you leave."
                                : "Start planning your next family adventure.",
                        actionLabel:
                            groupedTrips.upcoming.length > 0
                                ? "Open Trip"
                                : "Add Trip"
                    }}
                    onAction={() => {
                        if (groupedTrips.upcoming.length > 0) {
                            toggleExpandedTrip(groupedTrips.upcoming[0].id)
                        } else {
                            startAddTrip()
                        }
                    }}
                />

                {showForm && (
                    <SectionCard
                        title={editingTripId ? "Edit Trip" : "Add Trip"}
                        subtitle="Add the key trip details and who is going."
                    >
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

                            <Button
                                className="full-width"
                                type="submit"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingTripId
                                        ? "Save Changes"
                                        : "Save Trip"}
                            </Button>
                        </form>
                    </SectionCard>
                )}

                <SectionCard title="Trips" subtitle="Upcoming, later, unscheduled, and past travel plans.">
                    {loading ? (
                        <p>Loading trips...</p>
                    ) : trips.length === 0 ? (
                        <p className="dashboard-empty">No trips planned yet.</p>
                    ) : (
                        <>
                            <div className="eg-stack">
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
                            </div>
                        </>
                    )}
                </SectionCard>
            </div>
        </AppPage>
    )
}