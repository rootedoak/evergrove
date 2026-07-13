import React from "react"

import { APP_VERSION } from "../config/appConfig"
import { trackUsageEvent } from "../services/analytics/usageEventService"

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            hasError: false
        }
    }

    static getDerivedStateFromError() {
        return {
            hasError: true
        }
    }

    componentDidCatch(error, errorInfo) {
        console.error(
            "Evergrove Error Boundary",
            error,
            errorInfo
        )

        trackUsageEvent({
            eventType: "application_error",
            entityType: "error_boundary",
            metadata: {
                message:
                    error?.message ||
                    "Unknown application error",
                component_stack:
                    errorInfo?.componentStack ||
                    null,
                pathname:
                    window.location.pathname,
                search:
                    window.location.search,
                app_version:
                    APP_VERSION,
                occurred_at:
                    new Date().toISOString()
            }
        })
    }

    handleRefresh = () => {
        window.location.reload()
    }

    handleGoHome = () => {
        window.location.href = "/"
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-page">
                    <div className="error-boundary-card">
                        <img
                            className="error-boundary-logo"
                            src="/brand/favicon.svg"
                            alt=""
                            aria-hidden="true"
                        />

                        <div className="error-boundary-copy">
                            <span className="error-boundary-eyebrow">
                                Evergrove
                            </span>

                            <h1>
                                Looks like we wandered off the trail.
                            </h1>

                            <p>
                                Something unexpected happened.
                                Your information is still be safe.
                                Let&apos;s get you back where you were.
                            </p>
                        </div>

                        <div className="error-boundary-actions">
                            <button
                                type="button"
                                className="error-boundary-primary"
                                onClick={this.handleRefresh}
                            >
                                Refresh
                            </button>

                            <button
                                type="button"
                                className="error-boundary-secondary"
                                onClick={this.handleGoHome}
                            >
                                Return Home
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}