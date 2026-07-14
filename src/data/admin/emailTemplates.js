const FONT_STACK =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"

const SAMPLE_CONFIRMATION_URL =
    "https://www.evergroveapp.com/login?preview=email-link"

const SAMPLE_OTP = "483921"

function renderHeader() {
    return `
        <div style="
            text-align:center;
            padding-bottom:32px;
        ">
            <div style="
                font-size:36px;
                font-weight:700;
                color:#1E3A5F;
                font-family:${FONT_STACK};
            ">
                Evergrove
            </div>

            <div style="
                color:#64748B;
                margin-top:6px;
                letter-spacing:.08em;
                font-size:13px;
                font-family:${FONT_STACK};
            ">
                Where organized families grow.
            </div>
        </div>
    `
}

function renderLinkButton({
    label,
    url = SAMPLE_CONFIRMATION_URL
}) {
    return `
        <div style="
            margin:40px 0;
            text-align:center;
        ">
            <a
                href="${url}"
                style="
                    background:#1E3A5F;
                    color:#ffffff;
                    padding:16px 34px;
                    border-radius:10px;
                    text-decoration:none;
                    font-weight:600;
                    display:inline-block;
                    font-family:${FONT_STACK};
                "
            >
                ${label}
            </a>
        </div>

        <p style="
            font-size:14px;
            color:#64748B;
            font-family:${FONT_STACK};
        ">
            Or copy and paste this link into your browser:
        </p>

        <p style="
            word-break:break-all;
            font-family:${FONT_STACK};
        ">
            <a href="${url}">
                ${url}
            </a>
        </p>
    `
}

function renderFooter({
    ignoreMessage
}) {
    return `
        <hr style="
            border:none;
            border-top:1px solid #E2E8F0;
            margin:40px 0;
        " />

        <p style="
            font-size:15px;
            color:#64748B;
            line-height:1.7;
            font-family:${FONT_STACK};
        ">
            Need help? Simply reply to this email or visit the
            Evergrove Trust Center. We're always happy to help.
        </p>

        <div style="
            margin:32px 0;
            font-family:${FONT_STACK};
        ">
            <p style="
                margin:0;
                font-size:16px;
                color:#1E3A5F;
                font-weight:600;
            ">
                The Evergrove Team
            </p>

            <p style="
                margin:6px 0 0;
                font-size:14px;
                color:#64748B;
            ">
                Where organized families grow.
            </p>
        </div>

        <p style="
            font-size:13px;
            color:#94A3B8;
            line-height:1.6;
            font-family:${FONT_STACK};
        ">
            ${ignoreMessage}
        </p>
    `
}

function renderEmail({
    heading,
    content,
    action = "",
    securityMessage,
    ignoreMessage
}) {
    return `
        <!doctype html>
        <html lang="en">
            <body style="
                margin:0;
                padding:0;
                background:#F1F5F9;
            ">
                <div style="
                    width:100%;
                    padding:32px 16px;
                    box-sizing:border-box;
                ">
                    <div style="
                        max-width:640px;
                        margin:0 auto;
                        padding:40px;
                        border:1px solid #E2E8F0;
                        border-radius:18px;
                        background:#FFFFFF;
                        box-sizing:border-box;
                    ">
                        ${renderHeader()}

                        <h1 style="
                            margin:0 0 24px;
                            font-size:30px;
                            line-height:1.2;
                            color:#1E3A5F;
                            font-family:${FONT_STACK};
                        ">
                            ${heading}
                        </h1>

                        ${content}

                        ${action}

                        ${securityMessage
            ? `
                                    <p style="
                                        font-size:15px;
                                        color:#64748B;
                                        line-height:1.7;
                                        font-family:${FONT_STACK};
                                    ">
                                        ${securityMessage}
                                    </p>
                                `
            : ""
        }

                        ${renderFooter({
            ignoreMessage
        })}
                    </div>
                </div>
            </body>
        </html>
    `
}

const paragraph = value => `
    <p style="
        font-size:16px;
        line-height:1.7;
        color:#475569;
        font-family:${FONT_STACK};
    ">
        ${value}
    </p>
`

export const emailTemplates = [
    {
        id: "email-confirmation",
        name: "Email Confirmation",
        category: "Authentication",
        provider: "Supabase Auth",
        subject: "Confirm Your Email | Evergrove",
        description:
            "Sent when a new user needs to confirm their email address.",
        html: renderEmail({
            heading: "Welcome to Evergrove",
            content: [
                paragraph(
                    "We're honored you've chosen to join Evergrove."
                ),
                paragraph(
                    "Evergrove helps families keep track of calendars, tasks, meals, shopping, trips, school, and everyday life—all in one calm, shared place."
                ),
                paragraph(
                    "Before we can finish setting up your household, please confirm your email address."
                )
            ].join(""),
            action: renderLinkButton({
                label: "Confirm My Email"
            }),
            securityMessage:
                "For your security, this confirmation link will expire automatically after a limited time.",
            ignoreMessage:
                "If you didn't create an Evergrove account, you can safely ignore this email."
        })
    },
    {
        id: "household-invitation",
        name: "Household Invitation",
        category: "Authentication",
        provider: "Supabase Auth",
        subject: "You've Been Invited to Evergrove",
        description:
            "Sent when someone is invited to join an Evergrove household.",
        html: renderEmail({
            heading: "You've been invited to join a household",
            content: [
                paragraph(
                    "Great news! Someone has invited you to join their household on Evergrove."
                ),
                paragraph(
                    "Evergrove brings your family's calendars, tasks, meals, shopping, trips, school, and everyday life together in one calm, shared place."
                ),
                paragraph(
                    "Click below to accept your invitation and join your household."
                )
            ].join(""),
            action: renderLinkButton({
                label: "Accept Invitation"
            }),
            securityMessage:
                "For your security, this invitation link will expire automatically after a limited time.",
            ignoreMessage:
                "If you weren't expecting this invitation, you can safely ignore this email."
        })
    },
    {
        id: "otp",
        name: "One-Time Password",
        category: "Authentication",
        provider: "Supabase Auth",
        subject: "Your Evergrove Verification Code",
        description:
            "Provides a one-time code for secure account verification.",
        html: renderEmail({
            heading: "Your Evergrove verification code",
            content: `
                ${paragraph(
                "Use the code below to continue securely with Evergrove."
            )}

                <div style="
                    margin:40px 0;
                    text-align:center;
                ">
                    <div style="
                        display:inline-block;
                        padding:18px 28px;
                        border:1px solid #CBD5E1;
                        border-radius:14px;
                        background:#F8FAFC;
                        color:#1E3A5F;
                        font-size:34px;
                        font-weight:700;
                        letter-spacing:.18em;
                        font-family:${FONT_STACK};
                    ">
                        ${SAMPLE_OTP}
                    </div>
                </div>

                ${paragraph(
                "Enter this code in Evergrove to finish signing in or verifying your account."
            )}
            `,
            securityMessage:
                "For your security, this code will expire automatically after a limited time. Please do not share it with anyone.",
            ignoreMessage:
                "If you didn't request this code, you can safely ignore this email."
        })
    },
    {
        id: "change-email",
        name: "Change Email Address",
        category: "Authentication",
        provider: "Supabase Auth",
        subject: "Confirm Your New Email Address | Evergrove",
        description:
            "Sent when a user requests to change their account email address.",
        html: renderEmail({
            heading: "Confirm your new email address",
            content: [
                paragraph(
                    "You recently requested to change the email address associated with your Evergrove account."
                ),
                paragraph(
                    "Please confirm your new email address to complete the update."
                )
            ].join(""),
            action: renderLinkButton({
                label: "Confirm Email Address"
            }),
            securityMessage:
                "For your security, this confirmation link will expire automatically after a limited time.",
            ignoreMessage:
                "If you didn't request this change, you can safely ignore this email."
        })
    },
    {
        id: "reset-password",
        name: "Reset Password",
        category: "Authentication",
        provider: "Supabase Auth",
        subject: "Reset Your Evergrove Password",
        description:
            "Sent when a user asks to reset their Evergrove password.",
        html: renderEmail({
            heading: "Reset your password",
            content: [
                paragraph(
                    "We received a request to reset the password for your Evergrove account."
                ),
                paragraph(
                    "Click the button below to choose a new password."
                )
            ].join(""),
            action: renderLinkButton({
                label: "Reset Password"
            }),
            securityMessage:
                "For your security, this link will expire automatically after a limited time.",
            ignoreMessage:
                "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged."
        })
    },
    {
        id: "reauthentication",
        name: "Reauthentication",
        category: "Authentication",
        provider: "Supabase Auth",
        subject: "Confirm It's You | Evergrove",
        description:
            "Verifies a user's identity before a sensitive account action.",
        html: renderEmail({
            heading: "Confirm it's you",
            content: [
                paragraph(
                    "To protect your Evergrove account, we need to verify your identity before completing a sensitive action."
                ),
                paragraph(
                    "Use the verification code below to continue securely."
                ),
                `
                    <div style="
                        margin:40px 0;
                        text-align:center;
                    ">
                        <div style="
                            display:inline-block;
                            padding:18px 28px;
                            border:1px solid #CBD5E1;
                            border-radius:14px;
                            background:#F8FAFC;
                            color:#1E3A5F;
                            font-size:34px;
                            font-weight:700;
                            letter-spacing:.18em;
                            font-family:${FONT_STACK};
                        ">
                            ${SAMPLE_OTP}
                        </div>
                    </div>
                `
            ].join(""),
            securityMessage:
                "For your security, this verification code will expire automatically after a limited time. Please do not share it with anyone.",
            ignoreMessage:
                "If you didn't request this verification, you can safely ignore this email."
        })
    }
]

export function getEmailTemplate(templateId) {
    return emailTemplates.find(
        template => template.id === templateId
    )
}