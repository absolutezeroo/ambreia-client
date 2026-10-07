// Historically this rewrote http(s)://vortex-assets.local/* down to a bare path
// (e.g. "/dcr/...") on localhost, so the request would hit the Vite dev proxy
// instead of the real host. The dev setup now serves vortex-assets.local directly
// over CORS (Apache VirtualHost with Access-Control-Allow-Origin), with no Vite
// proxy in front of it, so URLs must stay absolute and untouched.
export function normalizeLocalAssetUrl(url: string): string
{
    return url;
}