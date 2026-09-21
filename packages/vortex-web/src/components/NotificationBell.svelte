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

    let open = $state(false);
    let loading = $state(false);
    let unread = $state(0);
    let items = $state<INotification[]>([]);

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
        return listenToNotifications((count) => untrack(() => (unread = count)));
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
                class="relative z-[201] block rounded-[3px] border-2 border-pill-line bg-pill px-3 py-[5px] font-condensed text-base leading-[22px] text-white uppercase shadow-pill">
            {t('SITE_NOTIF_TITLE')}
            {#if unread > 0}
                <!-- The count only when there is one. A permanent "0" is a control that always
                     looks like it wants something. -->
                <span class="ml-1.5 inline-block rounded-[3px] bg-danger px-1.5 leading-[18px]">{unread}</span>
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
