addEventListener('fetch', event => {
  event.respondWith(handleRequest(event, event.request))
})

async function handleRequest(event, request) {
  const url = new URL(request.url)
  if (url.host !== 'loj.cc.cd') return new Response('', { status: 404 })
  if (url.protocol === 'http:') {
    url.protocol = 'https:'
    return Response.redirect(url.href, 301)
  }

  if (url.pathname.startsWith('/_next/static/')) {
    const cache = await caches.open('loj-static')
    const cached = await cache.match(request)
    if (cached) return cached

    const response = await fetchFromTunnel(request)
    if (response.ok) {
      const cacheResponse = response.clone()
      cacheResponse.headers.set('Cache-Control', 'public, max-age=2592000, immutable')
      event.waitUntil(cache.put(request, cacheResponse))
    }
    return response
  }

  const response = await fetchFromTunnel(request)
  const headers = new Headers(response.headers)
  headers.set('access-control-allow-origin', '*')
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  headers.delete('content-security-policy')
  headers.delete('content-security-policy-report-only')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

async function fetchFromTunnel(request) {
  const url = new URL(request.url)
  url.host = 'tunnel.loj.cc.cd'
  const headers = new Headers(request.headers)
  headers.set('Host', 'tunnel.loj.cc.cd')
  return fetch(url.href, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    redirect: 'manual'
  })
}
