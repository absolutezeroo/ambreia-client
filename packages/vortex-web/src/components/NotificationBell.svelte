<script lang="ts">
    // The bell, beside the user menu.
    //
    // Built out of `UserMenu`'s own vocabulary and not a second dropdown of its own: the same
    // `bg-black/90` rounded panel, the same outside-click guard, the same pill for the toggle. The
    // one thing habbo.com cannot lend is the icon — its sheet has no bell, because habbo.com has
    // no notification centre at all (its notifications are e-mails, see
    // SETTINGS_ENABLE_NOTIFICATION_* in its own locale). So the toggle is the count, until an icon
    // is drawn for it the way icon_share and icon_comment were.
    import {untrack} from 'svelte';
    import {link} from 'svelte-spa-router';
    import Avatar from './Avatar.svelte';
    import {
        getNotifications,
        listenToNotifications,
        markNotificationsRead,
        type INotification,
    } from '../lib/notifications.js';
    import {notificationHref, notificationText} from '../lib/notificationText.js';
    import {t} from '../lib/i18n.js';
    import {signedIn} from '../lib/session.js';

    // The doorbell, six frames of it. Imported rather than referenced by path so the bundler
    // fingerprints them — and because each is about 530 bytes, well under Vite's 4KB inline
    // threshold, all six become `data:` URIs: the swap below never touches the network and no
    // frame can flash on its first showing.
    const FRAMES = [1, 2, 3, 4, 5, 6].map(
        (n) => new URL(`../assets/icon_doorbell_${n}.png`, import.meta.url).href,
    );

    /** How long one frame is held. Six of them makes the ring about half a second. */
    const FRAME_MS = 80;

    let open = $state(false);
    let loading = $state(false);
    let unread = $state(0);
    let items = $state<INotification[]>([]);

    // Which frame is showing. 0 is the resting one — the bell hangs still on every page of the
    // site, and only rings when something arrives.
    let frame = $state(0);
    let ringing: ReturnType<typeof setInterval> | null = null;

    /**
     * Rings once, then goes back to rest.
     *
     * A timer, and unapologetically: it runs for half a second per notification, which is not a
     * polling loop. What it must not do is outlive the component, hence the clear on unmount.
     */
    function ring()
    {
        if(ringing)
        {
            clearInterval(ringing);
        }

        frame = 0;

        ringing = setInterval(() =>
        {
            frame += 1;

            if(frame >= FRAMES.length)
            {
                frame = 0;

                clearInterval(ringing!);
                ringing = null;
            }
        }, FRAME_MS);
    }

    $effect(() => () =>
    {
        if(ringing)
        {
            clearInterval(ringing);
        }
    });

    // How many this player has in all, so the panel knows whether there are older ones. Without
    // it the bell showed the twenty most recent and nothing could reach past them.
    let total = $state(0);

    // The count arrives on its own. One SSE connection per signed-in tab, opened when the session
    // appears and closed when it goes or the component does — no polling, and no request at all
    // between one notification and the next. The stream sends the current count as its first
    // frame, so nothing needs fetching to fill the badge either.
    //
    // `untrack` is load-bearing and not a precaution. `$effect` subscribes to every `$state` it
    // READS while it runs, and an earlier version called a loader that read `loading` on its
    // first line before writing it — so the effect depended on a flag it set itself and re-ran on
    // its own write. That measured 34,000 requests in six seconds and saturated a CPU core. The
    // effect must depend on `$signedIn` and on nothing else, which is what this expresses.
    $effect(() =>
    {
        const isSignedIn = $signedIn;

        if(!isSignedIn)
        {
            untrack(() =>
            {
                items = [];
                unread = 0;
            });

            return;
        }

        // Returned from the effect, so Svelte closes it when the session changes or the header
        // unmounts. Without it, signing out and back in would leave a stream per attempt.
        return listenToNotifications((count) =>
            untrack(() =>
            {
                // Rings only when the count went UP. The stream sends the current state as its
                // first frame and again after a read clears it, and a bell that rang on the way
                // down would chime at the person who just emptied it.
                if(count > unread)
                {
                    ring();
                }

                unread = count;
            }));
    });

    async function load()
    {
        if(loading)
        {
            return;
        }

        loading = true;

        try
        {
            const page = await getNotifications();

            items = page.items ?? [];
            unread = page.unread;
            total = page.total;
        }
        catch
        {
            // Silent, and the COUNT is left alone. The bell is furniture on every page of the
            // site, so a hotel that is restarting must not put an error toast on the header of
            // the shop — and must not blank a badge either: the stream is what fills that, and
            // zeroing it here would throw away a number this failure knows nothing about.
            items = [];
        }
        finally
        {
            loading = false;
        }
    }

    /**
     * Older notifications, appended.
     *
     * Same shape as the feed's, and the same reason for deriving the page from what is held: a
     * notification can arrive while the panel is open, and a counter would then skip whichever
     * one the arrival pushed across the boundary.
     */
    async function more()
    {
        if(loading || items.length >= total)
        {
            return;
        }

        loading = true;

        try
        {
            const page = await getNotifications(Math.floor(items.length / PAGE_SIZE) + 1);
            const held = new Set(items.map((item) => item.id));

            items = [...items, ...(page.items ?? []).filter((item) => !held.has(item.id))];
            total = page.total;
        }
        catch
        {
            // Silent, like the first read: the panel is furniture on every page of the site.
        }
        finally
        {
            loading = false;
        }
    }

    /** The server's own default page size, applied when the request names none. */
    const PAGE_SIZE = 20;

    async function toggle()
    {
        open = !open;

        if(!open)
        {
            return;
        }

        await load();

        if(unread === 0)
        {
            return;
        }

        // Cleared as soon as they are in front of the player, and the count is zeroed here rather
        // than refetched — the server says how many it moved, and asking again for a number we
        // just caused is a round trip for nothing.
        try
        {
            await markNotificationsRead();

            unread = 0;
            items = items.map((item) => ({...item, seen: true}));
        }
        catch
        {
            // Left unread. It will clear on the next open, which is the right failure: a counter
            // that lies about being empty is worse than one that is stubborn.
        }
    }

    // `event.target` is an EventTarget, not an Element — a click on the document itself has no
    // `closest`, and a TypeError in a window listener takes down the only thing that closes this.
    // Same guard, same reason, as UserMenu.
    function outside(event: MouseEvent)
    {
        const target = event.target instanceof Element ? event.target : null;

        if(open && !target?.closest('[data-notifications]'))
        {
            open = false;
        }
    }
</script>

<svelte:window onclick={outside} />

{#if $signedIn}
    <div class="relative" data-notifications>
        <button type="button" onclick={toggle}
                aria-expanded={open}
                aria-label={t('SITE_NOTIF_TITLE')}
                class="relative z-[201] flex items-center gap-1.5 rounded-[3px] border-2 border-pill-line bg-pill px-3 py-[5px] font-condensed text-base leading-[22px] text-white uppercase shadow-pill">
            <!-- The box is pinned at the widest frame's 24px and the image centred in it: frame 3
                 is 22 wide where the other five are 24, and left to flow the icon would step 1px
                 sideways twice per ring. The word this replaced is still the control's accessible
                 name, on `aria-label` above — an icon-only button with none would be unreadable
                 to a screen reader. -->
            <!-- Dimmed when there is nothing, full white when there is or while it rings.
                 `opacity` and not `grayscale`, which would do nothing: the artwork is 142 pixels
                 of pure #ffffff, measured — zero saturation, so there is no colour to remove. On
                 this pill, white at half is what reads as grey. -->
            <span class="flex h-[18px] w-6 items-center justify-center {unread > 0 || frame > 0 ? '' : 'opacity-50'}">
                <img src={FRAMES[frame]} alt="" class="block" />
            </span>

            {#if unread > 0}
                <!-- The count only when there is one. A permanent "0" is a control that always
                     looks like it wants something. -->
                <span class="inline-block rounded-[3px] bg-danger px-1.5 leading-[18px]">{unread}</span>
            {/if}
        </button>

        <!-- Under the toggle and to its right edge, so a long list does not push the header
             about. Capped and scrollable rather than paged: the panel shows the most recent, and
             what falls off the bottom is older than anybody is looking for. -->
        <div class="absolute top-full right-0 z-[200] mt-1.5 w-[320px] overflow-hidden rounded-[10px] bg-black/90 transition-[max-height,opacity] duration-200 ease-out"
             style="max-height:{open ? '420px' : '0'};opacity:{open ? 1 : 0}">
            <ul class="max-h-[420px] overflow-y-auto py-3">
                {#each items as item (item.id)}
                    {@const href = notificationHref(item)}
                    <!-- A hairline between rows and none under the last, which is what keeps four
                         one-line notifications from reading as one paragraph. -->
                    <li class="border-b border-white/10 px-3 last:border-b-0">
                        <!-- Two shapes for one row, because a row that leads nowhere must not look
                             like a link. The inside of both is the same snippet. -->
                        {#if href}
                            <a {href} use:link onclick={() => (open = false)}
                               class="flex items-start gap-2 py-2 hover:border-b-0">
                                {@render row(item)}
                            </a>
                        {:else}
                            <div class="flex items-start gap-2 py-2">
                                {@render row(item)}
                            </div>
                        {/if}
                    </li>
                {:else}
                    <li class="px-3 py-1.5 text-white">{t('SITE_NOTIF_EMPTY')}</li>
                {/each}

                <!-- A plain underlined line rather than a Button: this sits inside a 320px dark
                     panel of text rows, and a full-width crimson control at the bottom of it
                     would read as the panel's action rather than as one more row. -->
                {#if items.length < total}
                    <li class="px-3 pt-2">
                        <button type="button" onclick={more} disabled={loading}
                                class="text-sm text-white underline hover:text-nav-link-hover disabled:no-underline">
                            {t('SITE_NOTIF_MORE')}
                        </button>
                    </li>
                {/if}
            </ul>
        </div>
    </div>
{/if}

{#snippet row(item: INotification)}
    <!-- The head's column is reserved whether or not there is a head in it. Half of these lines
         are the hotel's own — a lapsed membership, a sale — and without the empty slot those rows
         start at the panel's edge while the rest start 46px in, which reads as two lists.

         `well`, never a bare head: without it Avatar renders an <img> with no dimensions and a
         flex row stretches it to the row's own height. 46 is the smallest size the site uses. -->
    <span class="block h-[46px] w-[46px] shrink-0">
        {#if item.actor}
            <Avatar user={item.actor.name} figure={item.actor.figureString} well={46} />
        {/if}
    </span>

    <!-- `self-center`, so a one-line notification sits against the middle of its head rather than
         at the top of a 46px box. -->
    <span class="min-w-0 flex-1 self-center {item.seen ? 'text-white/70' : 'text-white'}">
        {notificationText(item)}
    </span>
{/snippet}
