const CACHE_NAME = "evergrove-cache-v1"

const STATIC_ASSETS = [
    "/",
    "/manifest.webmanifest",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/maskable-512.png"
]

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS)
        })
    )

    self.skipWaiting()
})

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            )
        })
    )

    self.clients.claim()
})

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return

    event.respondWith(
        fetch(event.request)
            .then(response => response)
            .catch(async () => {
                const cachedResponse = await caches.match(event.request)

                if (cachedResponse) {
                    return cachedResponse
                }

                return new Response("Offline", {
                    status: 503,
                    statusText: "Offline",
                    headers: {
                        "Content-Type": "text/plain",
                    },
                })
            })
    )
})

self.addEventListener("push", event => {
    let data = {}

    if (event.data) {
        data = event.data.json()
    }

    const title = data.title || "Evergrove"
    const options = {
        body: data.body || "You have a new Evergrove update.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: {
            url: data.url || "/",
        },
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    )
})

self.addEventListener("notificationclick", event => {
    event.notification.close()

    const urlToOpen = event.notification.data?.url || "/"

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true,
        }).then(clientList => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    client.focus()
                    return
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(urlToOpen)
            }
        })
    )
})