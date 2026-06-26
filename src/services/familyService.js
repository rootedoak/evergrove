import { supabase } from "../lib/supabase"
import { ensureMyHousehold } from "./householdService"
import { completeOnboarding } from "./preferenceService"

function createInviteToken() {
    const randomPart = crypto.randomUUID()
        .replaceAll("-", "")
        .slice(0, 12)
        .toUpperCase()

    return `EG-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}-${randomPart.slice(8, 12)}`
}

function getInviteExpirationDate() {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString()
}

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user
}

export async function getFamilyMembers() {
    const household = await ensureMyHousehold()

    const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("household_id", household.id)
        .order("created_at", { ascending: true })

    if (error) throw error

    return data || []
}

export async function createFamilyMember(member) {
    const user = await getCurrentUser()
    const household = await ensureMyHousehold()

    const shouldLinkToCurrentUser =
        member.link_to_current_user === true

    const { link_to_current_user, ...cleanMember } = member

    if (shouldLinkToCurrentUser) {
        const { data: existingMember, error: existingMemberError } = await supabase
            .from("family_members")
            .select("*")
            .eq("user_id", user.id)
            .eq("household_id", household.id)
            .maybeSingle()

        if (existingMemberError) throw existingMemberError

        if (existingMember) {
            const { data, error } = await supabase
                .from("family_members")
                .update({
                    ...cleanMember,
                    user_id: user.id,
                    household_id: household.id
                })
                .eq("id", existingMember.id)
                .select()
                .single()

            if (error) throw error

            return data
        }
    }

    const { data, error } = await supabase
        .from("family_members")
        .insert([
            {
                ...cleanMember,
                user_id: shouldLinkToCurrentUser ? user.id : null,
                household_id: household.id
            }
        ])
        .select()
        .single()

    if (error) throw error

    return data
}

export async function updateFamilyMember(id, updates) {
    const household = await ensureMyHousehold()

    const { data, error } = await supabase
        .from("family_members")
        .update(updates)
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteFamilyMember(id) {
    const household = await ensureMyHousehold()

    const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error

    return true
}

export async function createPendingInvite(email) {
    const household = await ensureMyHousehold()
    const normalizedEmail = email.trim().toLowerCase()
    const inviteToken = createInviteToken()

    const { data, error } = await supabase
        .from("family_members")
        .insert({
            household_id: household.id,
            role: "parent",
            member_type: "adult",
            invite_email: normalizedEmail,
            invite_status: "pending",
            invite_token: inviteToken,
            invite_expires_at: getInviteExpirationDate(),
            name: normalizedEmail
        })
        .select()
        .single()

    if (error) throw error

    return data
}

export async function acceptPendingInvite(email) {
    const user = await getCurrentUser()
    const normalizedEmail = email.trim().toLowerCase()

    const { data: invite, error: inviteError } = await supabase
        .from("family_members")
        .select("*")
        .eq("invite_email", normalizedEmail)
        .eq("invite_status", "pending")
        .maybeSingle()

    if (inviteError) throw inviteError

    if (!invite) {
        throw new Error("No pending invite found for that email.")
    }

    const { data: existingMembership, error: membershipLookupError } = await supabase
        .from("household_members")
        .select("id")
        .eq("household_id", invite.household_id)
        .eq("user_id", user.id)
        .maybeSingle()

    if (membershipLookupError) throw membershipLookupError

    if (!existingMembership) {
        const { error: householdMemberError } = await supabase
            .from("household_members")
            .insert({
                household_id: invite.household_id,
                user_id: user.id,
                role: invite.role || "member"
            })

        if (householdMemberError) throw householdMemberError
    }

    const { data, error } = await supabase
        .from("family_members")
        .update({
            invite_status: "accepted",
            linked_user_id: user.id,
            user_id: user.id,
            name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                invite.name ||
                user.email,
        })
        .eq("id", invite.id)
        .select()
        .single()

    if (error) throw error

    await completeOnboarding()

    return data
}

export async function getPendingInviteForCurrentUser() {
    const user = await getCurrentUser()
    const normalizedEmail = user.email?.trim().toLowerCase()

    if (!normalizedEmail) {
        throw new Error("No email found for current user.")
    }

    const { data, error } = await supabase
        .from("family_members")
        .select(`
            *,
            households (
                id,
                name,
                created_by
            )
        `)
        .eq("invite_email", normalizedEmail)
        .eq("invite_status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) throw error

    return data
}

export async function acceptPendingInviteForCurrentUser() {
    const user = await getCurrentUser()
    const normalizedEmail = user.email?.trim().toLowerCase()

    if (!normalizedEmail) {
        throw new Error("No email found for current user.")
    }

    return acceptPendingInvite(normalizedEmail)
}

export async function getPendingInviteByToken(inviteToken) {
    const cleanToken = inviteToken?.trim()

    if (!cleanToken) {
        throw new Error("Invite token is required.")
    }

    const { data, error } = await supabase
        .from("family_members")
        .select(`
            *,
            households (
                id,
                name,
                created_by
            )
        `)
        .eq("invite_token", cleanToken)
        .eq("invite_status", "pending")
        .maybeSingle()

    if (error) throw error

    if (!data) return null

    if (
        data.invite_expires_at &&
        new Date(data.invite_expires_at) < new Date()
    ) {
        throw new Error("This invite has expired.")
    }

    return data
}

export async function acceptPendingInviteByToken(inviteToken) {
    const invite = await getPendingInviteByToken(inviteToken)
    const user = await getCurrentUser()

    if (!invite) {
        throw new Error("No pending invite found.")
    }

    const { data: existingMembership, error: membershipLookupError } = await supabase
        .from("household_members")
        .select("id")
        .eq("household_id", invite.household_id)
        .eq("user_id", user.id)
        .maybeSingle()

    if (membershipLookupError) throw membershipLookupError

    if (!existingMembership) {
        const { error: householdMemberError } = await supabase
            .from("household_members")
            .insert({
                household_id: invite.household_id,
                user_id: user.id,
                role: invite.role || "member"
            })

        if (householdMemberError) throw householdMemberError
    }

    const { data, error } = await supabase
        .from("family_members")
        .update({
            invite_status: "accepted",
            linked_user_id: user.id,
            user_id: user.id,
            name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                invite.name ||
                user.email,
        })
        .eq("id", invite.id)
        .select()
        .single()

    if (error) throw error

    await completeOnboarding()

    return data
}