/**
 * The `postMessage` protocol between this site and the client it frames.
 *
 * The site half. The client half is `packages/vortex-client/src/SiteChannel.ts`, and the two must
 * be edited together: the packages share no module, so nothing but this comment ties the names
 * together, and a name that drifts does not fail a build — the message just stops arriving.
 *
 * Same-origin both ways: the site proxies the client at `/client`, so each side names
 * `window.location.origin` rather than `*`, and checks `event.origin` and `event.source` on the way
 * in.
 */
export const ClientChannel = {
    /**
	 * Site → client. Re-delivers habbo.com's own `/hotel?link=…` handover to an already-running
	 * client. Payload: `{type, link}`.
	 */
    LINK: 'vortex:link',

    /**
	 * Client → site. The session is over and the player has acknowledged it: drop the frame and get
	 * a fresh SSO ticket before showing the hotel again. Payload: `{type}`.
	 */
    DISCONNECTED: 'vortex:disconnected',
} as const;
