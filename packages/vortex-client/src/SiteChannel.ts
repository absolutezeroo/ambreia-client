/**
 * The `postMessage` protocol between this client and the site that frames it.
 *
 * Both halves are literals in two repositories that share no module — `vortex-web` does not depend on
 * `vortex-client` — so the names cannot be imported across the boundary. They can at least stop
 * being sprinkled: this file is the client half and
 * the website repository's `src/lib/clientChannel.ts` is the site half, and the two must be edited
 * together. A name that drifts here does not fail a build, it just stops delivering, which is the
 * whole reason neither side spells one inline any more.
 *
 * Same-origin is what makes the channel cheap and what secures it: the site proxies this client at
 * `/client`, so both sides name `window.location.origin` as the target rather than `*`, and both
 * check `event.origin` plus the expected `event.source` on the way in.
 */
// TS-only: AS3 took its handover in FlashVars and was reloaded for each visit, so it has no
//   counterpart for either direction of this channel.
export const SiteChannel = {
    /**
	 * Site → client. Re-delivers habbo.com's own `/hotel?link=…` handover to an already-running
	 * client (`navigator/goto/42`, `habboUI/open/hccenter`). Payload: `{type, link}`.
	 */
    LINK: 'vortex:link',

    /**
	 * Client → site. The player acknowledged that the session is over, so the site should drop the
	 * frame and get a fresh SSO ticket before showing the hotel again. Payload: `{type}`.
	 *
	 * This is where AS3 calls `LoginFlow.showDisconnected()`; login lives in `vortex-web` here.
	 */
    DISCONNECTED: 'vortex:disconnected',
} as const;
