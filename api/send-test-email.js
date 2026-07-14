import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

function getMissingEnvVars() {
    return [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "RESEND_TEST_API_KEY",
        "EVERGROVE_EMAIL_FROM"
    ].filter(envVar => !process.env[envVar])
}

function isValidEmail(value) {
    if (typeof value !== "string") return false

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        value.trim()
    )
}

async function getAuthenticatedAdmin(req, supabase) {
    const authorization =
        req.headers.authorization || ""

    if (!authorization.startsWith("Bearer ")) {
        return {
            user: null,
            error: "Missing authorization token"
        }
    }

    const accessToken =
        authorization.slice("Bearer ".length)

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
        return {
            user: null,
            error: "Invalid authorization token"
        }
    }

    const {
        data: adminUser,
        error: adminError
    } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle()

    if (adminError) {
        throw adminError
    }

    if (!adminUser) {
        return {
            user: null,
            error: "Administrator access required"
        }
    }

    return {
        user,
        error: null
    }
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        })
    }

    try {
        const missingEnvVars = getMissingEnvVars()

        if (missingEnvVars.length > 0) {
            return res.status(500).json({
                error:
                    `Missing environment variables: ${missingEnvVars.join(", ")
                    }`
            })
        }

        const {
            to,
            subject,
            html,
            templateId
        } = req.body ?? {}

        if (!isValidEmail(to)) {
            return res.status(400).json({
                error: "A valid recipient email is required."
            })
        }

        if (
            typeof subject !== "string" ||
            !subject.trim()
        ) {
            return res.status(400).json({
                error: "Email subject is required."
            })
        }

        if (
            typeof html !== "string" ||
            !html.trim()
        ) {
            return res.status(400).json({
                error: "Email HTML is required."
            })
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        const {
            user,
            error: authError
        } = await getAuthenticatedAdmin(
            req,
            supabase
        )

        if (authError) {
            return res.status(401).json({
                error: authError
            })
        }

        const resend = new Resend(
            process.env.RESEND_TEST_API_KEY
        )

        const {
            data,
            error
        } = await resend.emails.send({
            from: process.env.EVERGROVE_EMAIL_FROM,
            to: [to.trim()],
            subject: subject.trim(),
            html,
            replyTo:
                process.env.EVERGROVE_EMAIL_REPLY_TO ||
                undefined,
            tags: templateId
                ? [
                    {
                        name: "template",
                        value: String(templateId)
                    },
                    {
                        name: "source",
                        value: "evergrove-hq"
                    }
                ]
                : [
                    {
                        name: "source",
                        value: "evergrove-hq"
                    }
                ]
        })

        if (error) {
            console.error(
                "Resend test email error:",
                error
            )

            return res.status(502).json({
                error:
                    error.message ||
                    "Resend could not send the test email."
            })
        }

        console.info("HQ test email sent", {
            resendEmailId: data?.id,
            templateId: templateId || null,
            requestedBy: user.id,
            recipient: to.trim()
        })

        return res.status(200).json({
            success: true,
            emailId: data?.id || null
        })
    } catch (error) {
        console.error(
            "send-test-email error:",
            error
        )

        return res.status(500).json({
            error:
                error.message ||
                "Unable to send test email."
        })
    }
}