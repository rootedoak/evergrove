import { useEffect, useState } from "react"
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

export default function Trips() {
    const navigate = useNavigate()

    const { trips, loading, refreshTrips } = useTrips()
    const { tasks, refreshTasks } = useTasks()

    const [familyMembers, setFamilyMembers] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState(initialForm)
    const [selectedMembers, setSelectedMembers] = useState([])

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
            alert(`Checklist created for ${trip.name}.`)
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not create checklist.")
        }
    }

    function handleViewChecklist(trip) {
        navigate(`/tasks?tripId=${trip.id}`)
    }

    return (
        <>
            <section className="hero-card">
                <div className="section-header">
                    <div>
                        <p className="eyebrow">Trips</p>
                        <h2>Family Trips</h2>
                        <p>
                            Track vacations, weekend trips, family visits,
                            and travel plans.
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
                </div>
            </section>

            {showForm && (
                <section className="card">
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

                        <div className="full-width">
                            <strong>Who's Going?</strong>

                            <div className="stack">
                                {familyMembers.map(member => (
                                    <label key={member.id}>
                                        <input
                                            type="checkbox"
                                            checked={selectedMembers.includes(member.id)}
                                            onChange={() => toggleMember(member.id)}
                                        />
                                        {" "}
                                        {member.avatar_emoji} {member.name}
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

            <div className="grid">
                {loading ? (
                    <section className="card">
                        Loading trips...
                    </section>
                ) : trips.length === 0 ? (
                    <section className="card">
                        No trips planned yet.
                    </section>
                ) : (
                    trips.map(trip => {
                        const checklistTasks = getTripChecklistTasks(trip.id)
                        const hasChecklist = checklistTasks.length > 0
                        const openChecklistCount = checklistTasks.filter(
                            task => task.status !== "complete"
                        ).length

                        return (
                            <section className="card" key={trip.id}>
                                <h3>{trip.name}</h3>

                                {trip.destination && (
                                    <p>📍 {trip.destination}</p>
                                )}

                                <p>
                                    {trip.start_date}
                                    {trip.end_date ? ` → ${trip.end_date}` : ""}
                                </p>

                                {trip.trip_family_members?.length > 0 && (
                                    <p>
                                        {trip.trip_family_members
                                            .map(attendee => attendee.family_members?.name)
                                            .filter(Boolean)
                                            .join(", ")}
                                    </p>
                                )}

                                {trip.notes && <p>{trip.notes}</p>}

                                {hasChecklist && (
                                    <p>
                                        Checklist created • {openChecklistCount} open
                                    </p>
                                )}

                                <div className="card-actions">
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
                            </section>
                        )
                    })
                )}
            </div>
        </>
    )
}