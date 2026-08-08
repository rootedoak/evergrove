import { useEffect, useState } from "react"
import {
    LoaderCircle,
    Tag,
    X
} from "lucide-react"

import Button from "../../../components/ui/Button"

const initialForm = {
    name: "",
    code: "",
    description: "",
    offerType: "beta_access",
    maxRedemptions: "",
    expiresAt: "",
    percentOff: "",
    amountOff: "",
    trialDays: "",
    billingStatusAfterRedemption: "beta"
}

const offerTypeOptions = [
    {
        value: "beta_access",
        label: "Beta Access"
    },
    {
        value: "lifetime",
        label: "Lifetime Access"
    },
    {
        value: "extended_trial",
        label: "Extended Trial"
    },
    {
        value: "percent_discount",
        label: "Percentage Discount"
    },
    {
        value: "fixed_discount",
        label: "Fixed Discount"
    }
]

export default function PromoCodeForm({
    open,
    saving = false,
    error = "",
    onClose,
    onSubmit
}) {
    const [form, setForm] = useState(initialForm)

    useEffect(() => {
        if (open) {
            setForm(initialForm)
        }
    }, [open])

    useEffect(() => {
        if (!open) return undefined

        function handleKeyDown(event) {
            if (
                event.key === "Escape" &&
                !saving
            ) {
                onClose()
            }
        }

        window.addEventListener(
            "keydown",
            handleKeyDown
        )

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            )
        }
    }, [open, saving, onClose])

    if (!open) {
        return null
    }

    function updateField(field, value) {
        setForm(current => ({
            ...current,
            [field]: value
        }))
    }

    function handleCodeChange(value) {
        const normalizedValue = value
            .toUpperCase()
            .replace(
                /[^A-Z0-9_-]/g,
                ""
            )

        updateField(
            "code",
            normalizedValue
        )
    }

    function handleSubmit(event) {
        event.preventDefault()

        onSubmit({
            name: form.name,
            code: form.code,
            description: form.description,
            offerType: form.offerType,
            maxRedemptions:
                form.maxRedemptions,
            expiresAt:
                form.expiresAt
                    ? new Date(
                        `${form.expiresAt}T23:59:59`
                    ).toISOString()
                    : null,
            percentOff:
                form.offerType ===
                    "percent_discount"
                    ? form.percentOff
                    : null,
            amountOff:
                form.offerType ===
                    "fixed_discount"
                    ? form.amountOff
                    : null,
            trialDays:
                form.offerType ===
                    "extended_trial"
                    ? form.trialDays
                    : null,
            billingStatusAfterRedemption:
                form.offerType ===
                    "beta_access"
                    ? form
                        .billingStatusAfterRedemption
                    : null
        })
    }

    const submitDisabled =
        saving ||
        !form.name.trim() ||
        !form.code.trim() ||
        (
            form.offerType ===
            "extended_trial" &&
            !form.trialDays
        ) ||
        (
            form.offerType ===
            "percent_discount" &&
            !form.percentOff
        ) ||
        (
            form.offerType ===
            "fixed_discount" &&
            !form.amountOff
        )

    return (
        <div
            className="promo-dialog-backdrop"
            onMouseDown={event => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !saving
                ) {
                    onClose()
                }
            }}
        >
            <section
                className="promo-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="promo-dialog-title"
            >
                <header className="promo-dialog__header">
                    <div className="promo-dialog__title">
                        <div className="promo-dialog__icon">
                            <Tag size={20} />
                        </div>

                        <div>
                            <span>
                                Promotion
                            </span>

                            <h2 id="promo-dialog-title">
                                New Promo Code
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="promo-dialog__close"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close promo-code form"
                    >
                        <X size={20} />
                    </button>
                </header>

                <form
                    className="promo-form"
                    onSubmit={handleSubmit}
                >
                    <div className="promo-form__grid">
                        <label className="promo-form__field promo-form__field--full">
                            <span>
                                Promotion Name
                            </span>

                            <input
                                type="text"
                                value={form.name}
                                onChange={event =>
                                    updateField(
                                        "name",
                                        event.target.value
                                    )
                                }
                                placeholder="Founders Launch"
                                disabled={saving}
                                autoFocus
                            />
                        </label>

                        <label className="promo-form__field">
                            <span>
                                Promo Code
                            </span>

                            <input
                                type="text"
                                value={form.code}
                                onChange={event =>
                                    handleCodeChange(
                                        event.target.value
                                    )
                                }
                                placeholder="FOUNDERS"
                                disabled={saving}
                                autoComplete="off"
                            />

                            <small>
                                Letters, numbers, hyphens,
                                and underscores only.
                            </small>
                        </label>

                        <label className="promo-form__field">
                            <span>
                                Offer Type
                            </span>

                            <select
                                value={form.offerType}
                                onChange={event =>
                                    updateField(
                                        "offerType",
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            >
                                {offerTypeOptions.map(
                                    option => (
                                        <option
                                            key={
                                                option.value
                                            }
                                            value={
                                                option.value
                                            }
                                        >
                                            {
                                                option.label
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </label>

                        {form.offerType ===
                            "beta_access" && (
                                <label className="promo-form__field promo-form__field--full">
                                    <span>
                                        Access Status
                                    </span>

                                    <select
                                        value={
                                            form
                                                .billingStatusAfterRedemption
                                        }
                                        onChange={event =>
                                            updateField(
                                                "billingStatusAfterRedemption",
                                                event.target.value
                                            )
                                        }
                                        disabled={saving}
                                    >
                                        <option value="beta">
                                            Beta Access
                                        </option>

                                        <option value="trial">
                                            Trial Access
                                        </option>

                                        <option value="active">
                                            Active Access
                                        </option>
                                    </select>
                                </label>
                            )}

                        {form.offerType ===
                            "extended_trial" && (
                                <label className="promo-form__field promo-form__field--full">
                                    <span>
                                        Trial Length
                                    </span>

                                    <div className="promo-form__input-suffix">
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={
                                                form.trialDays
                                            }
                                            onChange={event =>
                                                updateField(
                                                    "trialDays",
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder="30"
                                            disabled={saving}
                                        />

                                        <span>
                                            days
                                        </span>
                                    </div>
                                </label>
                            )}

                        {form.offerType ===
                            "percent_discount" && (
                                <label className="promo-form__field promo-form__field--full">
                                    <span>
                                        Percentage Off
                                    </span>

                                    <div className="promo-form__input-suffix">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            step="1"
                                            value={
                                                form.percentOff
                                            }
                                            onChange={event =>
                                                updateField(
                                                    "percentOff",
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder="25"
                                            disabled={saving}
                                        />

                                        <span>%</span>
                                    </div>
                                </label>
                            )}

                        {form.offerType ===
                            "fixed_discount" && (
                                <label className="promo-form__field promo-form__field--full">
                                    <span>
                                        Fixed Discount
                                    </span>

                                    <div className="promo-form__input-prefix">
                                        <span>$</span>

                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={
                                                form.amountOff
                                            }
                                            onChange={event =>
                                                updateField(
                                                    "amountOff",
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder="25"
                                            disabled={saving}
                                        />
                                    </div>

                                    <small>
                                        This will connect to
                                        Stripe later.
                                    </small>
                                </label>
                            )}

                        <label className="promo-form__field">
                            <span>
                                Maximum Uses
                            </span>

                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={
                                    form.maxRedemptions
                                }
                                onChange={event =>
                                    updateField(
                                        "maxRedemptions",
                                        event.target.value
                                    )
                                }
                                placeholder="Unlimited"
                                disabled={saving}
                            />
                        </label>

                        <label className="promo-form__field">
                            <span>
                                Expiration
                            </span>

                            <input
                                type="date"
                                value={form.expiresAt}
                                onChange={event =>
                                    updateField(
                                        "expiresAt",
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            />
                        </label>

                        <label className="promo-form__field promo-form__field--full">
                            <span>
                                Description
                            </span>

                            <textarea
                                rows="3"
                                value={
                                    form.description
                                }
                                onChange={event =>
                                    updateField(
                                        "description",
                                        event.target.value
                                    )
                                }
                                placeholder="Describe who this promotion is for."
                                disabled={saving}
                            />
                        </label>
                    </div>

                    {error && (
                        <div
                            className="promo-form__error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <footer className="promo-form__actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={submitDisabled}
                        >
                            {saving ? (
                                <>
                                    <LoaderCircle
                                        size={17}
                                        className="growth-spinner"
                                    />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Tag size={17} />
                                    Create Promotion
                                </>
                            )}
                        </Button>
                    </footer>
                </form>
            </section>
        </div>
    )
}