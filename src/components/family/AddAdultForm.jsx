import Button from "../ui/Button"

export default function AddAdultForm({
    value,
    onChange,
    onSubmit,
    inviting
}) {
    function updateField(field, nextValue) {
        onChange(current => ({
            ...current,
            [field]: nextValue
        }))
    }

    return (
        <form
            className="form-grid"
            onSubmit={onSubmit}
        >
            <label>
                Email Address
                <input
                    type="email"
                    value={value.email}
                    onChange={event =>
                        updateField(
                            "email",
                            event.target.value
                        )
                    }
                    required
                />
            </label>

            <label>
                Name (optional)
                <input
                    value={value.name}
                    onChange={event =>
                        updateField(
                            "name",
                            event.target.value
                        )
                    }
                />
            </label>

            <Button
                className="full-width"
                type="submit"
                disabled={inviting}
            >
                {inviting
                    ? "Sending Invitation..."
                    : "Send Invitation"}
            </Button>
        </form>
    )
}