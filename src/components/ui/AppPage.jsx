export default function AppPage({ children, className = "" }) {
    return (
        <main className={`eg-page ${className}`}>
            <div className="eg-page-inner">
                {children}
            </div>
        </main>
    )
}