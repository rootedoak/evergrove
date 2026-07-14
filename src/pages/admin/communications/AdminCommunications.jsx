import { useMemo, useState } from "react"
import {
    CheckCircle2,
    Mail,
    Send
} from "lucide-react"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"

import {
    emailTemplates
} from "../../../data/admin/emailTemplates"

import {
    sendAdminTestEmail
} from "../../../services/admin/adminEmailService"

import {
    trackUsageEvent
} from "../../../services/analytics/usageEventService"

export default function AdminCommunications() {
    const [selectedTemplateId, setSelectedTemplateId] =
        useState(emailTemplates[0]?.id ?? "")

    const [recipient, setRecipient] = useState("")
    const [sending, setSending] = useState(false)
    const [message, setMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")

    const selectedTemplate = useMemo(
        () =>
            emailTemplates.find(
                template =>
                    template.id === selectedTemplateId
            ) ?? emailTemplates[0],
        [selectedTemplateId]
    )

    async function handleSendTest() {
        if (!selectedTemplate) return

        if (!recipient.trim()) {
            setErrorMessage(
                "Enter a recipient email address."
            )
            return
        }

        setSending(true)
        setMessage("")
        setErrorMessage("")

        try {
            const sendResult = await sendAdminTestEmail({
                to: recipient.trim(),
                subject:
                    `[TEST] ${selectedTemplate.subject}`,
                html: selectedTemplate.html,
                templateId: selectedTemplate.id
            })

            trackUsageEvent({
                eventType: "email_test_sent",
                entityType: "email_template",
                entityId: selectedTemplate.id,
                metadata: {
                    template_name: selectedTemplate.name,
                    provider: "resend",
                    category: selectedTemplate.category,
                    resend_email_id:
                        sendResult?.emailId || null,
                    source: "evergrove_hq"
                }
            })

            setMessage(
                `${selectedTemplate.name} test sent successfully.`
            )
        } catch (error) {
            console.error(
                "Unable to send email test",
                error
            )

            setErrorMessage(
                error.message ||
                "Unable to send the test email."
            )
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="admin-page">
            <AdminPageHeader
                eyebrow="Communications"
                title="Email Templates"
                description="Preview and test the email experiences Evergrove sends to families."
            />

            <section className="admin-email-workspace">
                <AdminCard title="Templates">
                    <div className="admin-email-template-list">
                        {emailTemplates.map(template => (
                            <button
                                key={template.id}
                                type="button"
                                className={
                                    selectedTemplateId ===
                                        template.id
                                        ? "admin-email-template active"
                                        : "admin-email-template"
                                }
                                onClick={() => {
                                    setSelectedTemplateId(
                                        template.id
                                    )
                                    setMessage("")
                                    setErrorMessage("")
                                }}
                            >
                                <div className="admin-email-template-icon">
                                    <Mail size={18} />
                                </div>

                                <div>
                                    <strong>
                                        {template.name}
                                    </strong>

                                    <span>
                                        {template.provider}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </AdminCard>

                <div className="admin-email-main">
                    <AdminCard title={selectedTemplate?.name}>
                        {selectedTemplate && (
                            <div className="admin-email-summary">
                                <div>
                                    <span>Provider</span>
                                    <strong>
                                        {selectedTemplate.provider}
                                    </strong>
                                </div>

                                <div>
                                    <span>Category</span>
                                    <strong>
                                        {selectedTemplate.category}
                                    </strong>
                                </div>

                                <div>
                                    <span>Subject</span>
                                    <strong>
                                        {selectedTemplate.subject}
                                    </strong>
                                </div>

                                <p>
                                    {selectedTemplate.description}
                                </p>
                            </div>
                        )}
                    </AdminCard>

                    <AdminCard title="Send Test">
                        <div className="admin-email-test-form">
                            <label htmlFor="admin-email-recipient">
                                Recipient email
                            </label>

                            <input
                                id="admin-email-recipient"
                                type="email"
                                value={recipient}
                                onChange={event =>
                                    setRecipient(
                                        event.target.value
                                    )
                                }
                                placeholder="you@evergroveapp.com"
                                autoComplete="email"
                            />

                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={handleSendTest}
                                disabled={sending}
                            >
                                <Send size={17} />

                                {sending
                                    ? "Sending..."
                                    : "Send Test Email"}
                            </button>

                            {message && (
                                <div
                                    className="admin-email-message success"
                                    role="status"
                                >
                                    <CheckCircle2 size={18} />
                                    {message}
                                </div>
                            )}

                            {errorMessage && (
                                <div
                                    className="admin-email-message error"
                                    role="alert"
                                >
                                    {errorMessage}
                                </div>
                            )}

                            <p className="admin-email-test-note">
                                Test messages use safe sample links and
                                verification codes. Real authentication
                                emails continue to be sent by Supabase.
                            </p>
                        </div>
                    </AdminCard>
                </div>

                <AdminCard title="Preview">
                    {selectedTemplate && (
                        <iframe
                            className="admin-email-preview"
                            title={`${selectedTemplate.name} preview`}
                            srcDoc={selectedTemplate.html}
                            sandbox=""
                        />
                    )}
                </AdminCard>
            </section>
        </div>
    )
}