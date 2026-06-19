import { useEffect, useState } from "react"

export default function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        const ios =
            /iphone|ipad|ipod/i.test(window.navigator.userAgent)

        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true

        setIsIOS(ios)
        setIsStandalone(standalone)

        const dismissed =
            localStorage.getItem("evergroveInstallBannerDismissed") === "true"

        if (!standalone && !dismissed) {
            setShowBanner(true)
        }

        function handleBeforeInstallPrompt(event) {
            event.preventDefault()
            setDeferredPrompt(event)
            setShowBanner(true)
        }

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
        }
    }, [])

    async function handleInstall() {
        if (!deferredPrompt) return

        deferredPrompt.prompt()

        await deferredPrompt.userChoice

        setDeferredPrompt(null)
        setShowBanner(false)
    }

    function handleDismiss() {
        localStorage.setItem("evergroveInstallBannerDismissed", "true")
        setShowBanner(false)
    }

    if (!showBanner || isStandalone) return null

    return (
        <div className="pwa-install-banner">
            <div>
                <strong>Install Evergrove</strong>
                <p>
                    Add Evergrove to your home screen for quick access to your
                    family dashboard, calendar, meals, and to-dos.
                </p>

                {isIOS && (
                    <p className="pwa-install-ios-note">
                        On iPhone: tap Share, then Add to Home Screen.
                    </p>
                )}
            </div>

            <div className="pwa-install-actions">
                {!isIOS && deferredPrompt && (
                    <button
                        type="button"
                        className="pwa-install-primary"
                        onClick={handleInstall}
                    >
                        Install
                    </button>
                )}

                <button
                    type="button"
                    className="pwa-install-secondary"
                    onClick={handleDismiss}
                >
                    Not now
                </button>
            </div>
        </div>
    )
}