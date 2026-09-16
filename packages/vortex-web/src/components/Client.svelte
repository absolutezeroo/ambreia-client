<script lang="ts">
    // `hotel/client/client.html`. Two things about it are structural, and this port had both wrong.
    //
    // 1. THE CLIENT IS NEVER UNMOUNTED. `.client` is `position:absolute; left:-9999px; top:0;
    //    width:100%; height:100%`, and `.client--visible` sets `left: 0`. The template keeps TWO
    //    flags — `visible` and `isOpen` — and `close()` only clears `visible`; the iframe survives
    //    because `ng-if` tests `isOpen`. So leaving the hotel PARKS the client off-screen with its
    //    socket, its room and its session intact, and coming back is instant. Rendering it inside
    //    the /hotel route instead destroys it on every exit, which is why the hotel had to be
    //    relaunched each time.
    //
    //    Hence this component lives at the app shell, not in a page, and is mounted once.
    //
    // 2. `.client__buttons` is at the TOP left — `{ left: 12px; top: 12px; z-index: 630 }` — and its
    //    two controls are ICONS, not labelled buttons: the close one is a gold pill with a
    //    left-pointing arrow head (the nav's green button mirrored) that widens on hover to reveal
    //    the word "Web", and the fullscreen one swaps between two sprite cuts.
    import Sprite from './Sprite.svelte';
    import HotelClosed from './HotelClosed.svelte';
    import * as api from '../lib/api.js';
    import {selectedId} from '../lib/session.js';
    import {CLIENT_URL} from '../lib/config.js';
    import {t} from '../lib/i18n.js';
    import {ClientChannel} from '../lib/clientChannel.js';

    // `link` is habbo.com's own `/hotel?link=…` handover — `navigator/goto/42` from an appart's
    // "Entrer dans l'appart", `habboUI/open/hccenter` from the purse.
    //
    // It rides on the iframe's URL the FIRST time, which is the only moment the URL is written: the
    // client is mounted once and never reloaded (see 1. above), so every later click used to do
    // nothing at all — the ceiling of parking the iframe rather than reloading it. The second
    // channel is `postMessage`, same-origin because the site proxies the client at `/client`, and
    // the client only accepts it from its own parent (vortex-client's App.ts::installLinkChannel).
    let {visible = false, link = '', onClose}:
    {
        visible?: boolean;
        link?: string;
        onClose: () => void;
    } = $props();

    let src = $state('');
    let error = $state('');
    let fullscreen = $state(false);

    // `$state` because `bind:this` assigns it and Svelte 5 warns about a plain `let` written that
    // way. Typed as the element so `requestFullscreen` is its own method rather than a property
    // nobody can check — and `?.` because the ref is undefined until the iframe mounts.
    let frame = $state<HTMLIFrameElement | undefined>();

    // The link the running client already has. Plain `let`, not `$state`: the delivery effect writes
    // it and must not re-run on its own write. It is cleared when the route drops the parameter,
    // which is what lets the SAME link work twice — leave the hotel, click the purse again, and the
    // second click is a new delivery rather than a repeat of the one already made.
    let delivered = '';

    // The ticket is fetched ONCE, on the first time the client is shown, and never again: it is
    // single use — the emulator burns it on the handshake — so asking for a second one on the next
    // visit would only produce a ticket nothing consumes. The already-connected iframe needs none.
    $effect(() =>
    {
        if(!visible || src || error)
        {
            return;
        }

        let cancelled = false;

        (async () =>
        {
            try
            {
                const result = await api.ssoToken($selectedId || undefined);

                if(!cancelled)
                {
                    const target = link ? `&link=${encodeURIComponent(link)}` : '';

                    // The URL delivers this one, so the channel below must not deliver it again:
                    // `navigator/goto/42` fired twice enters the appart twice.
                    delivered = link;
                    src = `${CLIENT_URL}/?sso=${encodeURIComponent(result.ssoToken)}${target}`;
                }
            }
            catch(failure)
            {
                if(!cancelled)
                {
                    error = (failure as Error)?.message ?? '';
                }
            }
        })();

        return () => (cancelled = true);
    });

    // The second channel. Runs on every change of `link`, does nothing until the iframe exists.
    $effect(() =>
    {
        if(!link)
        {
            delivered = '';

            return;
        }

        if(link === delivered) return;

        // `frame` is read before the bail so the effect re-runs when the iframe mounts: a link that
        // arrives while the client is still being created is delivered then, not dropped.
        const client = frame?.contentWindow;

        if(!client) return;

        delivered = link;

        // Targeted at our own origin: a wildcard would hand the link to whatever the iframe had
        // navigated to. If the client is still booting it queues this until the session is up.
        client.postMessage({type: ClientChannel.LINK, link}, window.location.origin);
    });

    // The way back out, and the only one there is. The client is mounted once and never reloads
    // itself, so when its session dies nothing on the page knows — the player sat in front of a dead
    // frame. The client now says so (vortex-client App.ts::_onDisconnectAcknowledged), and dropping
    // `src` unmounts the iframe outright: `{:else if src}` in the markup below means the dead client
    // stops existing rather than lingering at about:blank.
    //
    // Clearing `src` also re-arms the ticket effect above, so the next time the hotel is opened it
    // fetches a NEW ticket instead of reusing the one the server just disconnected.
    //
    // Accepted only from our own origin and only from this iframe: any page that can get a handle on
    // this window could otherwise close the hotel out from under the player.
    $effect(() =>
    {
        const onMessage = (event: MessageEvent): void =>
        {
            if(event.origin !== window.location.origin) return;
            if(!frame || event.source !== frame.contentWindow) return;

            const data = event.data as {type?: unknown} | null;

            if(!data || data.type !== ClientChannel.DISCONNECTED) return;

            src = '';
            delivered = '';
            onClose();
        };

        window.addEventListener('message', onMessage);

        return () => window.removeEventListener('message', onMessage);
    });

    function toggleFullscreen()
    {
        if(!document.fullscreenElement)
        {
            frame?.requestFullscreen?.();
            fullscreen = true;
        }
        else
        {
            document.exitFullscreen();
            fullscreen = false;
        }
    }
</script>

<!-- Parked at -9999px rather than hidden: `display:none` on an iframe makes the browser drop its
     layout, and some engines stop or reset media in it. Off-screen keeps it running. -->
<div class="absolute top-0 z-[600] h-full w-full {visible ? 'left-0' : 'left-[-9999px]'}">
    {#if error}
        <!-- `client-closed.html` — the ticket did not come back, so the hotel is shut as far as
             this visitor is concerned, and habbo.com's own box says so. `habbo-client-closed
             habbo-hotel-closed { max-width: 620px }`. -->
        <div class="flex h-full items-center justify-center bg-page px-3">
            <HotelClosed reason={error} className="w-full max-w-[620px]" />
        </div>
    {:else if src}
        <!-- `clipboard-write` is delegated because the client writes to the clipboard from inside
             this frame and a Permissions Policy blocks it otherwise, with nothing but a console
             violation to say so: the window debugger's copy buttons (diagnostic report, layout
             sources, canvas pixels) and the bug reporter both go through
             `navigator.clipboard.writeText`. Chrome does not inherit this one into a frame just
             because the frame is same-origin — it has to be named here. Read is NOT delegated:
             nothing in the client pastes, and `clipboard-read` prompts the user. -->
        <iframe bind:this={frame} {src} title="Vortex" class="h-full w-full border-0" allow="autoplay; fullscreen; clipboard-write"></iframe>
    {:else}
        <div class="flex h-full items-center justify-center bg-page">
            <p class="font-condensed uppercase text-ink">...</p>
        </div>
    {/if}

    <!-- `.client__buttons`: top left, z-630, the two controls fused into one gold pill. -->
    <div class="absolute top-3 left-3 z-[630] flex">
        <!-- The close button's arrow head, built from two borders exactly as
             `.client__close::before/::after` are — 15px in the border colour, 13px in the fill —
             and pointing LEFT, back towards the site. -->
        <!-- `.client__close { margin-left: 14px; padding: 5px 6px; border-left-width: 1px }`, and
             the margin is the load-bearing one: the arrow head is `left: -31px` on a 15px border,
             so its visible half starts 16px to the LEFT of the button. Sat flush against the row's
             own `left: 12px` that put the point at -4px and the browser clipped it, which is what
             made this button read as a squared-off block rather than an arrow. The 12px of padding
             this carried instead of 6 made the pill a sixth wider than habbo.com's on top of it. -->
        <button type="button" onclick={onClose} style="border-left-width:1px"
                class="group relative mr-1 ml-[14px] rounded-l-none rounded-r-[5px] border-2 border-[#ffea00] bg-[#ffb900] px-1.5 py-[5px] text-xs leading-[1.2] text-black uppercase drop-shadow-[-1px_4px_0_rgba(0,0,0,0.3)] hover:border-b-2 hover:border-[#fffd70] hover:bg-[#ffd400] active:translate-y-[2px] active:border-[#ffce37] active:bg-[#f89400] active:drop-shadow-[-1px_2px_0_rgba(0,0,0,0.3)]"
                title={t('CLIENT_TO_WEB_BUTTON')}>
            <span class="absolute -top-[2px] -left-[31px] block border-[15px] border-transparent border-r-[#ffea00] group-hover:border-r-[#fffd70] group-active:border-r-[#ffce37]"></span>
            <span class="absolute top-0 -left-[26px] block border-[13px] border-transparent border-r-[#ffb900] group-hover:border-r-[#ffd400] group-active:border-r-[#f89400]"></span>

            <span class="flex items-center">
                <Sprite name="habbo" />
                <!-- `.client__close__expand`: zero width until hover, then it opens on a 150ms
                     transition and the label slides out. -->
                <span class="block overflow-hidden transition-[width] duration-150 ease-out w-0 group-hover:w-[38px]">
                    <span class="block pl-1.5 leading-4">{t('CLIENT_TO_WEB_BUTTON')}</span>
                </span>
            </span>
        </button>

        <!-- `.client__fullscreen { padding-left: 6px; padding-right: 6px }` narrows the row's shared
             `padding: 6px 12px` to a square around the icon. -->
        <button type="button" onclick={toggleFullscreen}
                class="rounded-l-none rounded-r-[5px] border-2 border-[#ffea00] bg-[#ffb900] px-1.5 py-1.5 text-black shadow-btn hover:border-b-2 hover:border-[#fffd70] hover:bg-[#ffd400] active:translate-y-[2px] active:border-[#ffce37] active:bg-[#f89400] active:shadow-btn-active"
                title="{fullscreen ? 'Reduire' : 'Plein ecran'}">
            <Sprite name={fullscreen ? 'fullscreenBack' : 'fullscreen'} />
        </button>
    </div>
</div>
