import Button from "../ui/Button"

export default function AddChildForm({
    value,
    onChange,
    onSubmit,
    saving
}) {
    function updateField(field, nextValue) {
        onChange(current => ({
            ...current,
            [field]: nextValue
        }))
    }

    const hasAccount = value.hasAccount === "yes"

    return (
        <form
            className="form-grid"
            onSubmit={onSubmit}
        >
            <label className="full-width">
                Name
                <input
                    value={value.name}
                    onChange={event =>
                        updateField("name", event.target.value)
                    }
                    required
                />
            </label>

            <label className="full-width">
                Birthdate
                <input
                    type="date"
                    value={value.birthdate}
                    onChange={event =>
                        updateField(
                            "birthdate",
                            event.target.value
                        )
                    }
                    required={hasAccount}
                />
            </label>

            <fieldset className="full-width">
                <legend>
                    Will this child have their own Evergrove account?
                </legend>

                <label className="eg-radio-option">
                    <input
                        type="radio"
                        name="child-has-account"
                        value="no"
                        checked={value.hasAccount === "no"}
                        onChange={event =>
                            updateField(
                                "hasAccount",
                                event.target.value
                            )
                        }
                    />
                    No, just track them in our household
                </label>

                <label className="eg-radio-option">
                    <input
                        type="radio"
                        name="child-has-account"
                        value="yes"
                        checked={value.hasAccount === "yes"}
                        onChange={event =>
                            updateField(
                                "hasAccount",
                                event.target.value
                            )
                        }
                    />
                    Yes, invite them to Evergrove (13+)
                </label>
            </fieldset>

            {hasAccount ? (
                <label className="full-width">
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
            ) : (
                <>
                    <label>
                        Avatar Emoji
                        <input
                            value={value.avatar_emoji}
                            onChange={event =>
                                updateField(
                                    "avatar_emoji",
                                    event.target.value
                                )
                            }
                            placeholder="🧒"
                        />
                    </label>

                    <label>
                        School
                        <input
                            value={value.school}
                            onChange={event =>
                                updateField(
                                    "school",
                                    event.target.value
                                )
                            }
                        />
                    </label>

                    <label>
                        Grade
                        <input
                            value={value.grade}
                            onChange={event =>
                                updateField(
                                    "grade",
                                    event.target.value
                                )
                            }
                        />
                    </label>

                    <label className="full-width">
                        Notes
                        <textarea
                            value={value.notes}
                            onChange={event =>
                                updateField(
                                    "notes",
                                    event.target.value
                                )
                            }
                            rows="3"
                        />
                    </label>
                </>
            )}

            <Button
                className="full-width"
                type="submit"
                disabled={saving}
            >
                {saving
                    ? hasAccount
                        ? "Sending Invitation..."
                        : "Saving..."
                    : hasAccount
                        ? "Send Invitation"
                        : "Save Child"}
            </Button>
        </form>
    )
}