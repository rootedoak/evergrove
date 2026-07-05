import { supabase } from "../lib/supabase"

const BUCKET = "family-avatars"

export async function uploadFamilyAvatar(memberId, file) {
    if (!memberId) throw new Error("Missing family member id.")
    if (!file) throw new Error("Missing avatar file.")

    const resizedBlob = await resizeImageToSquare(file, 512)

    const filePath = `${memberId}.jpg`

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, resizedBlob, {
            contentType: "image/jpeg",
            upsert: true
        })

    if (uploadError) throw uploadError

    const {
        data: { publicUrl }
    } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath)

    const avatarUrl = `${publicUrl}?v=${Date.now()}`

    const { error: updateError } = await supabase
        .from("family_members")
        .update({ avatar_url: avatarUrl })
        .eq("id", memberId)

    if (updateError) throw updateError

    return avatarUrl
}

export async function deleteFamilyAvatar(memberId) {
    if (!memberId) throw new Error("Missing family member id.")

    const filePath = `${memberId}.jpg`

    await supabase.storage
        .from(BUCKET)
        .remove([filePath])

    const { error } = await supabase
        .from("family_members")
        .update({ avatar_url: null })
        .eq("id", memberId)

    if (error) throw error
}

function resizeImageToSquare(file, size = 512) {
    return new Promise((resolve, reject) => {
        const image = new Image()
        const objectUrl = URL.createObjectURL(file)

        image.onload = () => {
            try {
                const canvas = document.createElement("canvas")
                canvas.width = size
                canvas.height = size

                const context = canvas.getContext("2d")

                const sourceSize = Math.min(image.width, image.height)
                const sourceX = (image.width - sourceSize) / 2
                const sourceY = (image.height - sourceSize) / 2

                context.drawImage(
                    image,
                    sourceX,
                    sourceY,
                    sourceSize,
                    sourceSize,
                    0,
                    0,
                    size,
                    size
                )

                canvas.toBlob(
                    blob => {
                        URL.revokeObjectURL(objectUrl)

                        if (!blob) {
                            reject(new Error("Could not process image."))
                            return
                        }

                        resolve(blob)
                    },
                    "image/jpeg",
                    0.85
                )
            } catch (error) {
                URL.revokeObjectURL(objectUrl)
                reject(error)
            }
        }

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error("Could not load image."))
        }

        image.src = objectUrl
    })
}

export async function promptForAvatarUpload(memberId) {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input")

        input.type = "file"
        input.accept = "image/*"

        input.onchange = async event => {
            const file = event.target.files?.[0]

            if (!file) {
                resolve(false)
                return
            }

            try {
                await uploadFamilyAvatar(memberId, file)
                resolve(true)
            } catch (error) {
                reject(error)
            }
        }

        input.click()
    })
}