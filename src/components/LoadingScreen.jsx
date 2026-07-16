export default function LoadingScreen({
    message = "Loading Evergrove..."
}) {
    return (
        <div className="loading-screen">
            <div className="loading-card">
                <div className="brand-mark">
                    E
                </div>

                <p>{message}</p>
            </div>
        </div>
    )
}