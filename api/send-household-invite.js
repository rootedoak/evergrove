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

function getAppUrl() {
    return "https://evergroveapp.com"
}

function buildInviteEmail({
    inviteeName,
    householdName,
    inviterName,
    inviteUrl,
    isTeen
}) {
    const safeInviteeName = escapeHtml(inviteeName || "there")
    const safeHouseholdName = escapeHtml(
        householdName || "an Evergrove household"
    )
    const safeInviterName = escapeHtml(inviterName || "A family member")

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
                                            Household invitation
                                        </div>

                                        <h1 style="
                                            margin:0;
                                            font-size:38px;
                                            line-height:1.08;
                                            letter-spacing:-1.2px;
                                        ">
                                            Join ${safeHouseholdName}
                                        </h1>

                                        <p style="
                                            margin:18px 0 0;
                                            color:rgba(255,255,255,.76);
                                            font-size:17px;
                                            line-height:1.7;
                                        ">
                                            Hi ${safeInviteeName}, ${safeInviterName}
                                            invited you to join their household
                                            on Evergrove.
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:36px;">
                                        <p style="
                                            margin:0;
                                            color:#5f6f86;
                                            font-size:15px;
                                            line-height:1.8;
                                        ">
                                            ${isTeen
            ? "Create your Evergrove account to see the household items shared with you."
            : "Accept the invitation to help manage your household in Evergrove."}
                                        </p>

                                        <a
                                            href="${inviteUrl}"
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
                                            Join Household
                                        </a>

                                        <p style="
                                            margin:28px 0 0;
                                            color:#64748b;
                                            font-size:14px;
                                            line-height:1.7;
                                        ">
                                            This invitation expires in 14 days.
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

        if (userError || !user) {
            return res.status(401).json({
                error: "Invalid session"
            })
        }

        const { inviteId } = req.body || {}

        if (!inviteId) {
            return res.status(400).json({
                error: "Invite ID is required"
            })
        }

        const { data: invite, error: inviteError } =
            await supabase
                .from("family_members")
                .select(`
    id,
    household_id,
    name,
    member_type,
    invite_email,
    invite_status,
    invite_token,
    invite_expires_at,
    user_id,
    households (
        name
    )
`)
                .eq("id", inviteId)
                .maybeSingle()

        if (inviteError) throw inviteError

        if (!invite) {
            return res.status(404).json({
                error: "Invitation not found"
            })
        }

        if (invite.invite_status !== "pending") {
            return res.status(400).json({
                error: "Invitation is no longer pending"
            })
        }

        if (invite.user_id) {
            return res.status(400).json({
                error: "This invitation has already been accepted"
            })
        }

        const { data: membership, error: membershipError } =
            await supabase
                .from("household_members")
                .select("id, role")
                .eq("household_id", invite.household_id)
                .eq("user_id", user.id)
                .in("role", ["owner", "adult"])
                .limit(1)
                .maybeSingle()

        if (membershipError) {
            throw membershipError
        }

        const { data: adminUser, error: adminError } =
            await supabase
                .from("admin_users")
                .select("user_id")
                .eq("user_id", user.id)
                .maybeSingle()

        if (adminError) {
            throw adminError
        }

        const isHouseholdAdult =
            Boolean(membership) &&
            ["owner", "adult"].includes(membership.role)

        const isAdmin = Boolean(adminUser)

        if (!isHouseholdAdult && !isAdmin) {
            return res.status(403).json({
                error: "You cannot send invitations for this household"
            })
        }

        const inviterName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "A family member"

        const householdName =
            invite.households?.name ||
            "Your household"

        const inviteUrl =
            `${getAppUrl()}/invite/${invite.invite_token}`

        console.log("Household invite email details:", {
            inviteId: invite.id,
            inviteEmail: invite.invite_email,
            inviteToken: invite.invite_token,
            householdName,
            inviteUrl,
            from: process.env.EVERGROVE_EMAIL_FROM
        })

        const resend = new Resend(
            process.env.RESEND_API_KEY
        )

        const { data, error } = await resend.emails.send({
            from: "Evergrove <no-reply@auth.evergroveapp.com>",
            to: [invite.invite_email],
            subject: `You’re invited to join ${householdName} on Evergrove`,
            html: buildInviteEmail({
                inviteeName: invite.name,
                householdName,
                inviterName,
                inviteUrl,
                isTeen: invite.member_type === "teen"
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
        console.error("Household invite email error:", error)

        return res.status(500).json({
            error:
                error.message ||
                "Could not send household invitation"
        })
    }
}