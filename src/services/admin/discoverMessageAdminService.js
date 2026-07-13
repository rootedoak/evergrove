import { supabase } from "../../lib/supabase"

const DISCOVER_BUCKET = "discover-message-images"

function sanitizeFilename(filename = "image") {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9.-]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export async function getDiscoverMessages() {
    const [
        { data: messages, error: messagesError },
        { data: receipts, error: receiptsError },
        { count: eligibleUserCount, error: usersError }
    ] = await Promise.all([
        supabase
            .from("discover_messages")
            .select(`
            id,
            title,
            message,
            message_type,
            priority,
            action_label,
            action_url,
            dismissible,
            published,
            starts_at,
            ends_at,
            image_path,
            image_name,
            image_type,
            image_size,
            created_at,
            updated_at
        `)
            .order("created_at", {
                ascending: false
            }),

        supabase
            .from("discover_message_receipts")
            .select(`
            discover_message_id,
            user_id,
            first_seen_at,
            dismissed_at,
            action_clicked_at,
            view_count
        `),

        supabase
            .from("admin_user_summary")
            .select("user_id", {
                count: "exact",
                head: true
            })
    ])

    if (usersError) throw usersError
    if (messagesError) throw messagesError
    if (receiptsError) throw receiptsError

    const metricsByMessageId = new Map()

    for (const receipt of receipts ?? []) {
        const current =
            metricsByMessageId.get(
                receipt.discover_message_id
            ) ?? {
                seenCount: 0,
                dismissedCount: 0,
                actionClickCount: 0,
                totalViews: 0
            }

        if (receipt.first_seen_at) {
            current.seenCount += 1
        }

        if (receipt.dismissed_at) {
            current.dismissedCount += 1
        }

        if (receipt.action_clicked_at) {
            current.actionClickCount += 1
        }

        current.totalViews +=
            receipt.view_count ?? 0

        metricsByMessageId.set(
            receipt.discover_message_id,
            current
        )
    }

    return (messages ?? []).map(message => {
        const metrics =
            metricsByMessageId.get(message.id) ?? {
                seenCount: 0,
                dismissedCount: 0,
                actionClickCount: 0,
                totalViews: 0
            }

        const eligibleCount =
            eligibleUserCount ?? 0

        return {
            ...message,
            metrics: {
                ...metrics,
                eligibleCount,
                seenRate:
                    eligibleCount > 0
                        ? metrics.seenCount /
                        eligibleCount
                        : 0,
                dismissedRate:
                    eligibleCount > 0
                        ? metrics.dismissedCount /
                        eligibleCount
                        : 0,
                actionClickRate:
                    eligibleCount > 0
                        ? metrics.actionClickCount /
                        eligibleCount
                        : 0
            }
        }
    })
}

export async function getDiscoverMessageDetail(id) {
    if (!id) {
        throw new Error("Discover message id is required")
    }

    const { data, error } = await supabase
        .from("discover_messages")
        .select("*")
        .eq("id", id)
        .single()

    if (error) throw error

    let imageUrl = null

    if (data.image_path) {
        imageUrl = await getDiscoverMessageImageUrl(
            data.image_path
        )
    }

    return {
        ...data,
        image_url: imageUrl
    }
}

export async function createDiscoverMessage(payload) {
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError

    const { data, error } = await supabase
        .from("discover_messages")
        .insert({
            title: payload.title,
            message: payload.message,
            message_type:
                payload.message_type || "announcement",
            priority: Number(payload.priority) || 0,
            action_label:
                payload.action_label || null,
            action_url:
                payload.action_url || null,
            dismissible:
                payload.dismissible !== false,
            published:
                payload.published === true,
            starts_at:
                payload.starts_at || null,
            ends_at:
                payload.ends_at || null,
            created_by:
                user?.id || null
        })
        .select("*")
        .single()

    if (error) throw error

    return data
}

export async function updateDiscoverMessage(
    id,
    payload
) {
    if (!id) {
        throw new Error("Discover message id is required")
    }

    const { data, error } = await supabase
        .from("discover_messages")
        .update({
            title: payload.title,
            message: payload.message,
            message_type:
                payload.message_type || "announcement",
            priority: Number(payload.priority) || 0,
            action_label:
                payload.action_label || null,
            action_url:
                payload.action_url || null,
            dismissible:
                payload.dismissible !== false,
            published:
                payload.published === true,
            starts_at:
                payload.starts_at || null,
            ends_at:
                payload.ends_at || null,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select("*")
        .single()

    if (error) throw error

    return data
}

export async function publishDiscoverMessage(id) {
    return setDiscoverMessagePublished(id, true)
}

export async function unpublishDiscoverMessage(id) {
    return setDiscoverMessagePublished(id, false)
}

async function setDiscoverMessagePublished(
    id,
    published
) {
    const { data, error } = await supabase
        .from("discover_messages")
        .update({
            published,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select("*")
        .single()

    if (error) throw error

    return data
}

export async function uploadDiscoverMessageImage(
    discoverMessageId,
    file
) {
    if (!discoverMessageId) {
        throw new Error("Discover message id is required")
    }

    if (!file) {
        throw new Error("Image file is required")
    }

    const safeName = sanitizeFilename(file.name)
    const path = `${discoverMessageId}/${Date.now()}-${safeName}`

    const { error: uploadError } =
        await supabase.storage
            .from(DISCOVER_BUCKET)
            .upload(path, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type
            })

    if (uploadError) throw uploadError

    const { data, error: updateError } =
        await supabase
            .from("discover_messages")
            .update({
                image_path: path,
                image_name: file.name,
                image_type: file.type,
                image_size: file.size,
                updated_at:
                    new Date().toISOString()
            })
            .eq("id", discoverMessageId)
            .select("*")
            .single()

    if (updateError) {
        await supabase.storage
            .from(DISCOVER_BUCKET)
            .remove([path])

        throw updateError
    }

    return data
}

export async function removeDiscoverMessageImage(
    discoverMessage
) {
    if (!discoverMessage?.id) {
        throw new Error("Discover message is required")
    }

    if (discoverMessage.image_path) {
        const { error: storageError } =
            await supabase.storage
                .from(DISCOVER_BUCKET)
                .remove([
                    discoverMessage.image_path
                ])

        if (storageError) throw storageError
    }

    const { data, error } = await supabase
        .from("discover_messages")
        .update({
            image_path: null,
            image_name: null,
            image_type: null,
            image_size: null,
            updated_at: new Date().toISOString()
        })
        .eq("id", discoverMessage.id)
        .select("*")
        .single()

    if (error) throw error

    return data
}

export async function getDiscoverMessageImageUrl(
    path
) {
    if (!path) return null

    const { data, error } = await supabase.storage
        .from(DISCOVER_BUCKET)
        .createSignedUrl(path, 60 * 60)

    if (error) throw error

    return data?.signedUrl ?? null
}

export function getDiscoverMessageStatus(message) {
    const now = new Date()
    const startsAt = message.starts_at
        ? new Date(message.starts_at)
        : null
    const endsAt = message.ends_at
        ? new Date(message.ends_at)
        : null

    if (!message.published) {
        return "draft"
    }

    if (startsAt && startsAt > now) {
        return "scheduled"
    }

    if (endsAt && endsAt < now) {
        return "expired"
    }

    return "active"
}

export async function deleteDiscoverMessage(message) {
    if (!message?.id) {
        throw new Error("Discover message is required")
    }

    if (message.image_path) {
        const { error: storageError } =
            await supabase.storage
                .from(DISCOVER_BUCKET)
                .remove([message.image_path])

        if (storageError) throw storageError
    }

    const { error } = await supabase
        .from("discover_messages")
        .delete()
        .eq("id", message.id)

    if (error) throw error
}