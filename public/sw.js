/**
 * Service Worker pour Angel Narrative
 * Permet le fonctionnement offline et le cache des ressources
 */

const CACHE_VERSION = 'angel-v1';
const CACHE_NAME = `${CACHE_VERSION}-${new Date().toISOString().split('T')[0]}`;

// Ressources essentielles a mettre en cache
const URLS_TO_CACHE = [
    // HTML
    './index.html',

    // CSS
    '../src/css/main.css',
    '../src/css/angel.css',
    '../src/css/animations.css',

    // JS Core
    '../src/js/config.js',
    '../src/js/gameState.js',
    '../src/js/svgBuilder.js',
    '../src/js/questions.js',
    '../src/js/animations.js',
    '../src/js/api.js',
    '../src/js/app.js'
];

/**
 * Event: Installation du Service Worker
 * Cache les ressources essentielles
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing... Version:', CACHE_VERSION);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching', URLS_TO_CACHE.length, 'files');

                return Promise.all(
                    URLS_TO_CACHE.map((url) =>
                        cache.add(url).catch((err) => {
                            console.warn(`[SW] Failed to cache ${url}:`, err.message);
                        })
                    )
                );
            })
            .catch((err) => {
                console.error('[SW] Cache open error:', err);
            })
    );

    self.skipWaiting();
});

/**
 * Event: Activation du Service Worker
 * Nettoie les anciens caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating... Cleaning old caches');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('angel-')) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

/**
 * Event: Fetch (requetes reseau)
 * Strategie: Cache-First, Fallback Network
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Ignorer les requetes POST (webhooks, etc.)
    if (request.method !== 'GET') {
        return;
    }

    // Ignorer les requetes externes ou les webhooks
    if (request.url.includes('/webhook/') ||
        request.url.includes('api.anthropic.com') ||
        request.url.includes('n8n')) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(request)
                    .then((response) => {
                        if (response && response.status === 200) {
                            const responseToCache = response.clone();

                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        }

                        return response;
                    });
            })
            .catch(() => {
                if (request.mode === 'navigate') {
                    return caches.match('./index.html');
                }

                return new Response('Offline - Resource not available', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/plain'
                    })
                });
            })
    );
});

/**
 * Event: Message depuis le client
 */
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[SW] Cache cleared');
            event.ports[0].postMessage({ success: true });
        });
    }
});

console.log('[SW] Service Worker loaded. Version:', CACHE_VERSION);
