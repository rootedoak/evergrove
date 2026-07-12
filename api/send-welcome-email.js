import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

function getMissingEnvVars() {
    return [
        "RESEND_API_KEY",
        "EVERGROVE_EMAIL_FROM",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY"
    ].filter(name => !process.env[name])
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

function buildWelcomeEmail({
    firstName,
    householdName,
    appUrl
}) {
    const safeFirstName = escapeHtml(firstName || "there")
    const safeHouseholdName = escapeHtml(
        householdName || "your household"
    )

    return `
        <!doctype html>
        <html>
            <body style="
                margin:0;
                padding:0;
                background:#f7f9fc;
                font-family:Arial,Helvetica,sans-serif;
                color:#111b31;
            ">
                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    style="background:#f7f9fc;padding:32px 16px;"
                >
                    <tr>
                        <td align="center">
                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                style="
                                    max-width:620px;
                                    overflow:hidden;
                                    border:1px solid #e0e6ef;
                                    border-radius:24px;
                                    background:#ffffff;
                                "
                            >
                                <tr>
                                    <td style="
                                        padding:40px 36px;
                                        background:
                                            linear-gradient(
                                                145deg,
                                                #111b31,
                                                #173858
                                            );
                                        color:#ffffff;
                                    ">
                                        <div style="
                                            margin-bottom:14px;
                                            font-size:13px;
                                            font-weight:700;
                                            letter-spacing:1.5px;
                                            text-transform:uppercase;
                                            color:#b9ceff;
                                        ">
                                            Welcome home
                                        </div>

                                        <h1 style="
                                            margin:0;
                                            font-size:40px;
                                            line-height:1.05;
                                            letter-spacing:-1.5px;
                                        ">
                                            ${safeHouseholdName} is ready.
                                        </h1>

                                        <p style="
                                            margin:18px 0 0;
                                            color:rgba(255,255,255,.76);
                                            font-size:17px;
                                            line-height:1.7;
                                        ">
                                            Hi ${safeFirstName}, Evergrove is
                                            ready to help your family spend
                                            less time managing life and more
                                            time living it.
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:36px;">
                                        <h2 style="
                                            margin:0;
                                            font-size:22px;
                                            color:#111b31;
                                        ">
                                            A good place to start
                                        </h2>

                                        <ul style="
                                            margin:20px 0 0;
                                            padding-left:22px;
                                            color:#5f6f86;
                                            font-size:15px;
                                            line-height:1.8;
                                        ">
                                            <li>Add your first family event</li>
                                            <li>Create a shared to-do</li>
                                            <li>Plan dinner for tonight</li>
                                            <li>Invite another household member</li>
                                        </ul>

                                        <a
                                            href="${appUrl}"
                                            style="
                                                display:inline-block;
                                                margin-top:26px;
                                                padding:14px 20px;
                                                border-radius:12px;
                                                background:#2863eb;
                                                color:#ffffff;
                                                font-weight:700;
                                                text-decoration:none;
                                            "
                                        >
                                            Open Evergrove
                                        </a>

                                        <p style="
                                            margin:28px 0 0;
                                            color:#64748b;
                                            font-size:14px;
                                            line-height:1.7;
                                        ">
                                            Evergrove is still growing, and
                                            your feedback helps shape what it
                                            becomes.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="
                                margin:18px 0 0;
                                color:#8a97a8;
                                font-size:12px;
                            ">
                                Where organized families grow.
                            </p>
                        </td>
                    </tr>
                </table>
            </body>
        </html>
    `
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        })
    }

    const missingEnvVars = getMissingEnvVars()

    if (missingEnvVars.length > 0) {
        return res.status(500).json({
            error: `Missing environment variables: ${missingEnvVars.join(", ")}`
        })
    }

    try {
        const authHeader = req.headers.authorization

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Authentication required"
            })
        }

        const accessToken = authHeader.slice("Bearer ".length)

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            }
        )

        const {
            data: { user },
            error: userError
        } = await supabase.auth.getUser(accessToken)

        if (userError || !user?.email) {
            return res.status(401).json({
                error: "Invalid session"
            })
        }

        const { data: membership, error: membershipError } =
            await supabase
                .from("household_members")
                .select(`
                    household_id,
                    households (
                        name
                    )
                `)
                .eq("user_id", user.id)
                .limit(1)
                .maybeSingle()

        if (membershipError) {
            throw membershipError
        }

        const firstName =
            user.user_metadata?.full_name
                ?.trim()
                .split(/\s+/)[0] ||
            user.email.split("@")[0]

        const householdName =
            membership?.households?.name ||
            "Your household"

        const resend = new Resend(
            process.env.RESEND_API_KEY
        )

        const { data, error } = await resend.emails.send({
            from: process.env.EVERGROVE_EMAIL_FROM,
            to: [user.email],
            subject: `Welcome home to ${householdName}`,
            html: buildWelcomeEmail({
                firstName,
                householdName,
                appUrl:
                    process.env.VERCEL_PROJECT_PRODUCTION_URL
                        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
                        : "https://evergroveapp.com"
            })
        })

        if (error) {
            throw new Error(error.message)
        }

        return res.status(200).json({
            success: true,
            emailId: data?.id ?? null
        })
    } catch (error) {
        console.error("Welcome email error:", error)

        return res.status(500).json({
            error:
                error.message ||
                "Could not send welcome email"
        })
    }
}