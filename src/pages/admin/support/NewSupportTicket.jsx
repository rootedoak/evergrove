import { useState } from "react"
import { useNavigate } from "react-router-dom"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"

import {
    createProductFeedback
} from "../../../services/admin/productFeedbackAdminService"

const feedbackTypes = [
    { value: "bug", label: "Bug" },
    { value: "feature", label: "Feature" },
    { value: "improvement", label: "Improvement" },
    { value: "technical_debt", label: "Technical Debt" }
]

const priorities = [
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" }
]

const categories = [
    { value: "product", label: "Product" },
    { value: "hq", label: "Evergrove HQ" },
    { value: "customer_app", label: "Customer App" },
    { value: "public_website", label: "Public Website" },
    { value: "backend", label: "Backend" },
    { value: "notifications", label: "Notifications" },
    { value: "billing", label: "Billing" },
    { value: "other", label: "Other" }
]

export default function NewSupportTicket() {
    const navigate = useNavigate()

    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [feedbackType, setFeedbackType] = useState("bug")
    const [priority, setPriority] = useState("normal")
    const [category, setCategory] = useState("hq")
    const [pagePath, setPagePath] = useState("")
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(event) {
        event.preventDefault()

        setSaving(true)
        setError("")

        try {
            const ticket = await createProductFeedback({
                subject,
                message,
                feedbackType,
                priority,
                category,
                pagePath
            })

            navigate(`/admin/support/${ticket.id}`)
        } catch (submitError) {
            console.error("Could not create support ticket", submitError)

            setError(
                submitError?.message ||
                "The ticket could not be created."
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="admin-page">
            <AdminPageHeader
                eyebrow="Support"
                title="New Ticket"
                description="Create an internal Evergrove support ticket."
                actions={
                    <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() => navigate("/admin/support")}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                }
            />

            <AdminCard title="Ticket Details">
                <form
                    className="admin-form"
                    onSubmit={handleSubmit}
                >
                    <div className="admin-form-field">
                        <label htmlFor="ticket-subject">
                            Subject
                        </label>

                        <input
                            id="ticket-subject"
                            type="text"
                            value={subject}
                            onChange={event =>
                                setSubject(event.target.value)
                            }
                            placeholder="Briefly describe the issue"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="admin-form-field">
                        <label htmlFor="ticket-description">
                            Description
                        </label>

                        <textarea
                            id="ticket-description"
                            value={message}
                            onChange={event =>
                                setMessage(event.target.value)
                            }
                            placeholder="Describe what happened, what you expected, and anything useful for reproducing it."
                            rows={8}
                            required
                        />
                    </div>

                    <div className="admin-form-grid">
                        <div className="admin-form-field">
                            <label htmlFor="ticket-type">
                                Type
                            </label>

                            <select
                                id="ticket-type"
                                value={feedbackType}
                                onChange={event =>
                                    setFeedbackType(event.target.value)
                                }
                            >
                                {feedbackTypes.map(option => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-form-field">
                            <label htmlFor="ticket-priority">
                                Priority
                            </label>

                            <select
                                id="ticket-priority"
                                value={priority}
                                onChange={event =>
                                    setPriority(event.target.value)
                                }
                            >
                                {priorities.map(option => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-form-field">
                            <label htmlFor="ticket-category">
                                Category
                            </label>

                            <select
                                id="ticket-category"
                                value={category}
                                onChange={event =>
                                    setCategory(event.target.value)
                                }
                            >
                                {categories.map(option => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="admin-form-field">
                        <label htmlFor="ticket-page-path">
                            Page or route
                            <span className="admin-muted">
                                {" "}Optional
                            </span>
                        </label>

                        <input
                            id="ticket-page-path"
                            type="text"
                            value={pagePath}
                            onChange={event =>
                                setPagePath(event.target.value)
                            }
                            placeholder="/admin/support"
                        />
                    </div>

                    {error && (
                        <p className="admin-form-error">
                            {error}
                        </p>
                    )}

                    <div className="admin-form-actions">
                        <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() => navigate("/admin/support")}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="admin-primary-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Creating..."
                                : "Create Ticket"}
                        </button>
                    </div>
                </form>
            </AdminCard>
        </div>
    )
}
