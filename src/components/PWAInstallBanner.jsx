import { useEffect, useState } from "react"

export default function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isSafari, setIsSafari] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        const ios =
            /iphone|ipad|ipod/i.test(window.navigator.userAgent)

        const userAgent =
            window.navigator.userAgent

        const safari =
            /safari/i.test(userAgent) &&
            !/crios|fxios|edgios|opios/i.test(userAgent)

        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true

        setIsIOS(ios)
        setIsSafari(safari)
        setIsStandalone(standalone)

        if (!standalone) {
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
        setShowBanner(false)
    }

    if (!showBanner || isStandalone) return null

    return (
        <div className="pwa-install-banner">
            <div>
                <strong>
                    {isIOS
                        ? "Install Evergrove on your iPhone or iPad"
                        : "Install Evergrove"}
                </strong>

                {isIOS && !isSafari ? (
                    <>
                        <p>
                            Apple requires Evergrove to be installed from Safari.
                        </p>

                        <p className="pwa-install-ios-note">
                            Open this page in Safari, tap Share, then select
                            Add to Home Screen.
                        </p>
                    </>
                ) : isIOS ? (
                    <>
                        <p>
                            Add Evergrove to your Home Screen for quick access
                            and the best notification experience.
                        </p>

                        <p className="pwa-install-ios-note">
                            Tap Share, then select Add to Home Screen.
                        </p>
                    </>
                ) : (
                    <p>
                        Add Evergrove to your home screen for quick access to your
                        family dashboard, calendar, meals, and to-dos.
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