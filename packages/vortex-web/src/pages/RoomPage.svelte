<script lang="ts">
    // `/room/:id` — `room/room.html` -> `room/room-open/room-open.html`:
    //
    //   .room__thumbnail          110x110, top left
    //   .room__content__title     the appart's name, in ITS OWN case
    //   .room__content__left      owner avatar, then <habbo-room-info>, then the enter button
    //   .room-info                a two-column list: "Description" / value, "Tags" / value
    //   .room__content__right     .room__details — "Détails de l'appart", Note + Nombre de personne
    //                             .room__actions — "Rapporter l'appart"
    //   <habbo-room-picture>      `room.imageUrl`, full width UNDER the section
    //
    // The two are fed from the same kind of field on habbo.com — `room.imageUrl` /
    // `room.thumbnailUrl`, a PHOTO taken in-game with the camera and chosen by the owner — and this
    // port answers neither. They are NOT treated the same way, and the difference is the size of the
    // slot: the full-width band gets packages/vortex-imager's render of the appart, because it is
    // the same subject at the same size and the band is a big empty rectangle without it, while the
    // 114px thumbnail keeps the default plate — see lib/config.ts.
    //
    // Real since 2026-09-11: GET /api/public/rooms/{id} — habbo.com's own route ("/public/rooms/:id").
    // It answers 404 for a room whose door is invisible as well as for one that does not exist, so
    // this page cannot be used to confirm a hidden appart exists.
    import {link} from 'svelte-spa-router';
    import Sprite from '../components/Sprite.svelte';
    import Avatar from '../components/Avatar.svelte';
    import * as api from '../lib/api.js';
    import type {IRoomSummary} from '../lib/api.js';
    import {roomUrl, roomThumbnailUrl, hideOnError} from '../lib/config.js';
    import {t} from '../lib/i18n.js';
    import {signedIn} from '../lib/session.js';

    // `.room-restricted__content::before` — the key over "L'accès à l'appart est restreint."
    const ROOM_KEY = new URL('../assets/room_key.png', import.meta.url).href;

    let {params = {}} = $props();

    // habbo.com's enter button POSTs `/public/rooms/{id}/forward` and its server pushes the player
    // into the room over the game socket. There is no such route here and no forward queue behind
    // it, so this takes the client's OWN deep link instead — `navigator/goto/{id}` reaches
    // `HabboNewNavigator.linkReceived()`, which calls `goToPrivateRoom(roomId)`.
    //
    // DEVIATION with a known ceiling: the link rides in on the iframe's URL, and the client is
    // mounted once and never reloaded (components/Client.svelte). So it lands the first time the
    // hotel is opened in a session and not on a second click. Closing that needs either habbo.com's
    // server-side forward or a message channel into the iframe; until then it beats what this was
    // doing, which was opening the hotel and dropping the visitor in their own room.
    function enterLink(roomId: number): string
    {
        return `/hotel?link=${encodeURIComponent(`navigator/goto/${roomId}`)}`;
    }

    /** `navigator/report/<id>/<base64 name>`, built the way `RoomOpenController` builds it. */
    function reportLink(roomId: number, name: string): string
    {
        // Non-ASCII stripped BEFORE btoa, which is habbo.com's own `replace(/[^\x00-\x7F]/g, "")`:
        // btoa throws on anything above U+00FF, and an appart called "★ L'HÔTEL" is not rare.
        const ascii = btoa((name ?? '').replace(/[^\x00-\x7F]/g, '').trim());

        return `/hotel?link=${encodeURIComponent(`navigator/report/${roomId}/${ascii}`)}`;
    }

    let room = $state<IRoomSummary | null>(null);
    let loading = $state(true);

    $effect(() =>
    {
        const id = params.id;
        let cancelled = false;

        loading = true;

        void api.getRoom(id)
            .then((answer) => !cancelled && (room = answer))
            .catch(() => !cancelled && (room = null))
            .finally(() => !cancelled && (loading = false));

        return () => (cancelled = true);
    });
</script>

{#if loading}
    <main class="mx-auto max-w-[1200px] px-3 py-6"></main>
{:else if !room}
    <main class="mx-auto max-w-[1200px] px-3 py-6">
        <!-- An appart that is not there is habbo.com's NOT-FOUND, not a message of its own: its
             router has no per-resource wording and this had the French typed in. `…_TEXT` carries
             its own link home, which is why it renders as HTML — see NotFoundPage. -->
        <h3>{t('NOT_FOUND_PAGE_TITLE')}</h3>
        <div class="static-content">{@html t('NOT_FOUND_PAGE_TEXT')}</div>
        <p class="mt-3"><a href="/community/rooms" use:link>{t('ROOMS_TITLE')}</a></p>
    </main>
{:else if !room.doorOpen}
    <!-- `room.html` branches before anything else: `<habbo-room-restricted ng-if="room.doorMode !=
         'open'">` against `<habbo-room-open ng-if="room.doorMode == 'open'">`. A room behind a
         doorbell or a password does NOT get the full page — it gets the key, its name, the
         explanation, and the enter button, because entering is still allowed: what the web page
         cannot show is what is inside.

         `.room-restricted__content` is centred with the 264x212 key as a `::before`. -->
    <main class="mx-auto max-w-[1200px] px-3 pt-3 pb-6">
        <section class="text-center">
            <img src={ROOM_KEY} alt="" class="mx-auto mb-3 block h-[212px] w-[264px] [image-rendering:pixelated]" />

            <h3>{t('ROOM_RESTRICTED_TITLE')}</h3>
            <h4 class="normal-case">{room.name}</h4>
            <div class="mb-6">{t('ROOM_RESTRICTED_TEXT')}</div>

            {#if $signedIn}
                <a href={enterLink(room.id)} use:link
                   class="inline-block rounded-[5px] border-2 border-[#ffea00] bg-[#ffb900] py-1.5 pr-1.5 pl-3 text-center font-condensed text-base leading-[1.2] uppercase text-black shadow-btn hover:border-b-2 hover:border-[#fffd70] hover:bg-[#ffd400] active:translate-y-[2px] active:border-[#ffce37] active:bg-[#f89400] active:shadow-btn-active">
                    <span class="relative block pr-[27px] text-right leading-[26px]">
                        {t('ROOM_ENTER_BUTTON')}
                        <Sprite name="enterRoom" className="absolute top-1/2 right-0 -translate-y-1/2" />
                    </span>
                </a>
            {/if}
        </section>
    </main>
{:else}
    <main>
        <section class="mx-auto max-w-[1200px] px-3 py-6">
            <div class="flex gap-3">
                <!-- `.room__thumbnail` is NOT the gallery's plate, which this port used here:
                     114x114 on #01353c, a 2px #267b91 border, rounded 3px and the pill's shadow —
                     against `.room-item__thumbnail`'s 110x110 on #6796b1 with a 3px offset shadow.
                     Two plates, one per screen.

                     `.room__thumbnail__image` lays the owner's photo over this at 0,0, and it 404s
                     when the room has none — which is what `habbo-remove-on-error` (here
                     `hideOnError`) turns back into the plate underneath.

                     `self-start` because habbo.com's is `float:left` with a fixed 114px height, and
                     a flex child stretches to the row instead — which is why this plate used to run
                     the whole height of the panel beside it. -->
                <div class="relative shrink-0 self-start overflow-hidden rounded-[3px] border-2 border-pill-line bg-[#01353c] shadow-pill">
                    <Sprite name="roomThumbnail" />
                    <img src={roomThumbnailUrl(room.id)} alt="" onerror={hideOnError}
                         class="absolute top-0 left-0 h-full w-full object-cover" />
                </div>

                <div class="min-w-0 flex-1">
                    <h1 class="mt-0 normal-case">{room.name}</h1>

                    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <div class="min-w-0 flex-1">
                            <!-- The same `<habbo-avatar>` as the gallery card, and the name is its
                                 `<h6 class="avatar__title">` — condensed and white at 400, never
                                 bold. `.room__owner--user .avatar__image` puts 6px between them,
                                 where the gallery's puts 3. -->
                            <a href="/profile/{room.ownerName}" use:link class="flex items-center gap-1.5 hover:border-b-0">
                                <Avatar user={room.ownerName} well={46} />
                                <h6 class="m-0 truncate">{room.ownerName}</h6>
                            </a>

                            <!-- `.room-info`: a label column and a value column, not a paragraph. -->
                            <ul class="mt-6">
                                <li class="flex gap-6 py-1.5">
                                    <h3 class="m-0 w-[140px] shrink-0">{t('ROOM_DESCRIPTION')}</h3>
                                    <span class="min-w-0">{room.description}</span>
                                </li>
                                <li class="flex gap-6 py-1.5">
                                    <h3 class="m-0 w-[140px] shrink-0">{t('ROOM_TAGS')}</h3>
                                    <span class="min-w-0">{(room.tags ?? []).join(', ')}</span>
                                </li>
                            </ul>

                            <!-- `.room__enter-button` is the site's one GOLD button, and the only
                                 one with black text: `#ffb900` on `#ffea00`, hover `#ffd400`/`#fffd70`,
                                 active `#f89400`/`#ffce37`. It is not the green "play" ramp — that
                                 belongs to the navigation's hotel button — and it carries a little
                                 door in the 27px of padding it reserves on its right. -->
                            {#if $signedIn}
                                <a href={enterLink(room.id)} use:link
                                   class="mt-6 mb-3 inline-block rounded-[5px] border-2 border-[#ffea00] bg-[#ffb900] py-1.5 pr-1.5 pl-3 text-center font-condensed text-base leading-[1.2] uppercase text-black shadow-btn hover:border-b-2 hover:border-[#fffd70] hover:bg-[#ffd400] active:translate-y-[2px] active:border-[#ffce37] active:bg-[#f89400] active:shadow-btn-active">
                                    <span class="relative block pr-[27px] text-right leading-[26px]">
                                        {t('ROOM_ENTER_BUTTON')}
                                        <Sprite name="enterRoom" className="absolute top-1/2 right-0 -translate-y-1/2" />
                                    </span>
                                </a>
                            {/if}
                        </div>

                        <div class="w-full shrink-0 lg:w-[340px]">
                            <div class="overflow-hidden rounded-[3px] bg-card">
                                <h3 class="m-0 bg-panel-head px-3 py-1.5 [text-shadow:0_1px_#000]">{t('ROOM_DETAILS')}</h3>
                                <dl class="px-3 py-3">
                                    <div class="flex justify-between gap-3 py-0.5">
                                        <dt class="font-bold">{t('ROOM_RATING')}</dt>
                                        <dd>{room.score ?? 0}</dd>
                                    </div>
                                    <div class="flex justify-between gap-3 py-0.5">
                                        <dt class="font-bold">{t('ROOM_MAX_USERS')}</dt>
                                        <dd>{room.maximumVisitors}</dd>
                                    </div>
                                </dl>
                            </div>

                            <!-- `RoomOpenController` builds this itself:
                                   hotelReportLink = "/hotel?link=navigator/report/"
                                                     + room.uniqueId + "/" + btoa(name)
                                 — a deep link into the CLIENT's own report flow, which
                                 `HabboNewNavigator.linkReceived()` already handles as
                                 `report/<id>/<data>`. This port pointed it at /help, which is a
                                 CMS page and reports nothing.

                                 The name is base64'd after its non-ASCII is stripped, exactly as
                                 habbo.com does — `btoa` throws on anything above U+00FF, and an
                                 appart called "★ L'HÔTEL" is not rare. -->
                            <p class="mt-3">
                                <a href={reportLink(room.id, room.name)} use:link class="flex items-center gap-1.5">
                                    <Sprite name="report" />
                                    {t('ROOM_REPORT_ACTION')}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- `<habbo-room-picture>`: `.room-picture__wrapper`, black, centred, with a 25px shadow off
             its top edge. This is the ONE place the imager's render belongs — it is the same subject
             at the same size in the same slot, where on a 110px plate it was a different kind of
             picture standing in for one nobody took (see lib/config.ts).

             `hideOnError` is habbo.com's own `habbo-remove-on-error`: the imager is a separate
             process and is routinely not running, and a broken-image glyph reads as a bug in the
             page where an empty band reads as what it is. -->
        <div class="relative w-full overflow-hidden bg-black text-center after:absolute after:top-0 after:left-0 after:h-[25px] after:w-full after:bg-gradient-to-b after:from-black/50 after:to-transparent after:content-['']">
            <img src={roomUrl(room.id)} alt={room.name} onerror={hideOnError}
                 class="mx-auto max-w-full [image-rendering:auto]" />
        </div>
    </main>
{/if}
