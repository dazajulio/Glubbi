self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests from the same origin, ignore API calls and external scripts
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // Allow normal browser fetching without blocking or rejecting
  event.respondWith(
    fetch(event.request).catch((err) => {
      // In case of network failure during offline, return fallback or bubble
      console.warn('SW fetch fallback for:', event.request.url, err);
      return new Response('Network error occurred', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' },
      });
    })
  );
});
