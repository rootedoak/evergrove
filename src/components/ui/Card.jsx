export default function Card({ children, className = "" }) {
    return (
        <section className={`eg-card ${className}`}>
            {children}
        </section>
    )
}