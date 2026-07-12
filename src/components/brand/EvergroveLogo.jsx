export default function EvergroveLogo({
    variant = "horizontal",
    tone = "color",
    className = "",
    alt = "Evergrove"
}) {
    const sources = {
        horizontal: {
            color: "/brand/evergrove-logo-horizontal.svg",
            white: "/brand/evergrove-logo-horizontal-white.svg",
            navy: "/brand/evergrove-logo-horizontal-navy.svg"
        },
        stacked: {
            color: "/brand/evergrove-logo-stacked.svg",
            white: "/brand/evergrove-logo-stacked-white.svg",
            navy: "/brand/evergrove-logo-stacked-navy.svg"
        },
        mark: {
            color: "/brand/evergrove-mark-color.svg",
            white: "/brand/evergrove-mark-white.svg",
            navy: "/brand/evergrove-mark-navy.svg"
        }
    }

    const source =
        sources[variant]?.[tone] ??
        sources.horizontal.color

    return (
        <img
            src={source}
            alt={alt}
            className={`eg-logo eg-logo--${variant} ${className}`}
        />
    )
}