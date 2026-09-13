<script lang="ts">
    // `/profile/:name` — `profile/profile.html`, whose shape is specific and was guessed wrong here
    // before:
    //
    //   the profile header sits INSIDE the small header (`habbo-header-small class="profile__header"`)
    //   <main class="wrapper wrapper--content">
    //     .profile__card__wrapper--badges  > .profile__card > h2.profile__card__title + list + footer
    //     …--friends, …--rooms, …--groups   (that order; a card is omitted when its list is empty)
    //   <footer>  "membre depuis <date>" + THREE hearts
    //
    // Each card shows at most five items and its footer opens a modal with the rest — hence
    // "5 / 23" beside the friends title. And a group links to `/hotel?room=<id>`, never to a group
    // page: habbo.com has no such page, which is why this port no longer has one either.
    //
    // Real since 2026-09-11: `GET /api/public/users?name=` resolves the name the route carries, then
    // `GET /api/public/users/{uniqueId}/profile` answers the four lists. Both are anonymous, so a
    // signed-out visitor opening a profile link gets the page, which is what habbo.com does.
    import {link} from 'svelte-spa-router';
    import Avatar from '../components/Avatar.svelte';
    import Sprite from '../components/Sprite.svelte';
    import EmptyResults from '../components/EmptyResults.svelte';
    import ProfileListModal from '../components/ProfileListModal.svelte';
    import {me} from '../lib/session.js';
    import type {Snippet} from 'svelte';
    import * as api from '../lib/api.js';
    import type {IPlayerProfile} from '../lib/api.js';
    import type {IProfileListKind} from '../components/ProfileListModal.svelte';
    import {loadBadgeTexts, badgeName} from '../lib/badges.js';
    import {badgeUrl, groupBadgeUrl, hideOnError} from '../lib/config.js';
    import {t} from '../lib/i18n.js';

    // `.profile__card__wrapper--<kind> .profile__card__aligner::before`: a 140px-tall illustration
    // hanging ABOVE each card, which the aligner's own `margin-top:140px` reserves the room for.
    // The four PNGs were already mirrored into src/assets/ and had never been used.
    // `.profile__header`'s own background — fetched by tools/fetch-assets.mjs like every other
    // habbo.com bitmap here, and gitignored with them.
    const HEADER_BAND = new URL('../assets/profile_header.png', import.meta.url).href;

    const TEASERS = {
        badges: new URL('../assets/teaser_profile_badges.png', import.meta.url).href,
        friends: new URL('../assets/teaser_profile_friends.png', import.meta.url).href,
        rooms: new URL('../assets/teaser_profile_rooms.png', import.meta.url).href,
        groups: new URL('../assets/teaser_profile_groups.png', import.meta.url).href,
    };

    let {params = {}} = $props();

    // "Tout voir" opens `habbo-profile-modal` over the page — the full list, searchable, in its
    // STACKED form. This port unfolded the card in place instead, which is a different screen: the
    // card is capped at five deliberately, and the descriptions the modal exists to show are hidden
    // in the grid by `.item-list--grid .item__description{display:none}`.
    // Which of the four lists the modal is showing, or none. Typed against the modal's own union
    // rather than a bare string — it is also what builds the `PROFILE_<TYPE>_TITLE` key, so a fifth
    // value would render a key instead of a heading.
    let opened = $state<IProfileListKind | ''>('');

    const FIVE = 5;

    // Same format as the news feed's dates, which is the only other date the site prints.
    function joined(date: string): string
    {
        return new Date(date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'});
    }

    // `/profile` with no name is the signed-in player's own, which is how the user menu links here.
    const wanted = $derived(params.name || $me?.name || '');
    const own = $derived(!params.name || params.name === $me?.name);

    let profile = $state<IPlayerProfile | null>(null);
    let texts = $state({});
    let error = $state('');
    let loading = $state(true);

    const user = $derived(profile?.user ?? null);
    const badges = $derived(profile?.badges ?? []);
    const friends = $derived(profile?.friends ?? []);
    const rooms = $derived(profile?.rooms ?? []);
    const groups = $derived(profile?.groups ?? []);

    // What each CARD shows, which is not the first five of each list.
    //
    //   badges  <habbo-badge-list badges="ProfileController.profile.selectedBadges">
    //   friends ng-init="fiveFriends = (items.friends | orderBy: random | limitTo: 5)"
    //   rooms   ng-init="fiveRooms   = (items.rooms   | orderBy: random | limitTo: 5)"
    //   groups  ng-init="fiveGroups  = (items.groups  | orderBy: random | limitTo: 5)"
    //
    // Two rules, and this port had neither. The badges card is the player's SELECTED badges — the
    // five they pinned to their avatar — not the first five of everything they own, and it is the
    // one card with no limit because the game already caps the selection at five. The other three
    // are a random five, re-rolled on every load, which is what makes a profile with forty apparts
    // show a different handful each time instead of the same alphabetical five forever.
    //
    // `random` is habbo.com's own comparator, `.5 - Math.random()`, evaluated once per page through
    // `ng-init`. `$derived` here is the same: it recomputes when the profile arrives, not on every
    // read, so the five do not reshuffle while the page is open.
    const cardBadges = $derived(user?.selectedBadges ?? []);
    const cardFriends = $derived(fiveOf(friends));
    const cardRooms = $derived(fiveOf(rooms));
    const cardGroups = $derived(fiveOf(groups));

    // `orderBy: random | limitTo: 5`. Copied before sorting: `toSorted` leaves the source list alone,
    // and the modal renders that same list in its own order.
    function fiveOf<T>(list: T[]): T[]
    {
        return [...list].sort(() => 0.5 - Math.random()).slice(0, FIVE);
    }

    $effect(() =>
    {
        const name = wanted;
        // Read here rather than inside the async body so the effect re-runs when the signed-in
        // avatar changes: which of the two profile routes to use depends on it.
        const mine = $me?.uniqueId ?? '';
        let cancelled = false;

        loading = true;
        error = '';

        (async () =>
        {
            if(!name)
            {
                // Signed out, no name in the URL: there is no profile to ask for.
                if(!cancelled)
                {
                    loading = false;
                }

                return;
            }

            try
            {
                const found = await api.getUser(name);

                // habbo.com's `ProfileController` picks the route the same way:
                //   hasSession() && profile.uniqueId === user.uniqueId ? Profile.private() : …items()
                // The private read ignores the visibility flag, which is what lets a player who has
                // hidden their profile still look at it.
                const answer = found.uniqueId === mine
                    ? await api.getOwnProfile()
                    : await api.getProfile(found.uniqueId);

                // The badge texts are a second fetch and a big one; the page must not wait on it to
                // render, so the labels fill in when it lands.
                void loadBadgeTexts().then((loaded) =>
                {
                    if(!cancelled)
                    {
                        texts = loaded;
                    }
                });

                if(!cancelled)
                {
                    profile = answer;
                }
            }
            catch(failure)
            {
                if(!cancelled)
                {
                    profile = null;
                    error = (failure as Error)?.message ?? '';
                }
            }
            finally
            {
                if(!cancelled)
                {
                    loading = false;
                }
            }
        })();

        return () => (cancelled = true);
    });
</script>

<!-- `.profile__header`: a room shot behind the avatar, name and motto, `left bottom / 100%` and
     `image-rendering: pixelated` — it IS pixel art, and smoothing it turns the tiles to mush. The
     `::before` under it is a 2px gradient, which is what stops the band ending on a hard line.

     DEVIATION: habbo.com hangs this on the SMALL HEADER itself
     (`<habbo-header-small class="profile__header">`), so the room art runs behind the logo and the
     navigation as one continuous band — `habbo-header-small{background:#069}` is what it replaces.
     Here the header and the navigation are rendered by `App.svelte` for every route, and reaching
     up to repaint them from one page would mean a store or prop-drilling through the shell for a
     background image. The band therefore starts below the navigation. Its own proportions are
     habbo.com's exactly, which is what puts the avatar, the name and the motto where they belong. -->
<header class="relative mb-6 w-full bg-[length:100%] bg-[position:left_bottom] bg-no-repeat [image-rendering:pixelated] after:absolute after:-bottom-[2px] after:left-0 after:h-[2px] after:w-full after:bg-gradient-to-b after:from-black/30 after:to-transparent after:content-['']"
        style="background-image:url({HEADER_BAND})">
    <!-- `profile-header.html`, and the port had almost none of it:
         `.profile-header__avatar` reserves 46px and `align-self: flex-start`, while
         `.profile-header__image` inside it is 104 wide with `margin-left:16px; margin-right:24px`
         and a `::before` 88px disc at (-16, 24) — so the avatar OVERFLOWS its slot and tucks under
         the details plate, which reserves 58px of left padding for exactly that.

         `.profile-header__details` is the part that was missing entirely: a translucent black plate
         (rgba(0,0,0,.5), rounded 3px, 500px wide) holding the name and the motto. Without it the
         name sat on the room art with nothing behind it.

         And `.profile-header__details h1{text-transform:none}` — this is the one h1 on the site that
         keeps its case. It was rendering "ADMIN" where habbo.com renders "Admin". -->
    <!-- `habbo-profile-header{display:flex; align-items:center; height:142px}`, with
         `padding-left: 90px` from 767 and `130px` from 959. The height and that padding are the
         whole of the band's proportions — this port had a `py-6` strip about half as tall with the
         avatar hard against the left edge, which is why it never lined up with habbo.com's. -->
    <div class="mx-auto flex h-[142px] max-w-[1200px] items-center px-3 md:pl-[90px] lg:pl-[130px]">
        <div class="w-[46px] shrink-0 self-start">
            <div class="relative ml-4 mr-6 w-[104px] pt-[5px] before:absolute before:-left-4 before:top-6 before:h-[88px] before:w-[88px] before:rounded-full before:border-2 before:border-pill-line before:bg-pill before:shadow-pill before:content-['']">
                <Avatar figure={user?.figureString ?? ''} size="l" direction={2} className="relative block" />
            </div>
        </div>

        <div class="min-w-0 max-w-[500px] flex-1 self-center rounded-[3px] bg-black/50 py-3 pl-[58px] pr-6 break-all">
            <h1 class="m-0 normal-case">{user?.name ?? wanted}</h1>

            {#if user?.motto}
                <!-- `.profile__motto`: Ubuntu Habbo, 14px, one line with an ellipsis, and
                     habbo.com's own text shadow. -->
                <div class="truncate text-sm leading-[1.4] [text-shadow:0_1px_rgba(0,0,0,0.3)]">{user.motto}</div>
            {/if}
        </div>
    </div>
</header>

<main class="mx-auto max-w-[1200px] px-3">
    {#if error}
        <EmptyResults className="py-12" />
    {:else if !loading}
        <!-- `.profile__section{margin-left:-12px}` against `.profile__card__aligner{padding-left:12px}`:
             a 12px gutter, and two cards a row from 767px.

             A hidden profile needs no branch of its own. `.profile__section` carries an ng-if over
             all four lists, and the server answers a visitor with four empty ones, so the section
             simply does not render and the page is the header, "A rejoint Habbo le…" and the hearts
             — which is exactly what habbo.com shows. This port used to print a sentence there,
             borrowed from the registration form's promise. It addressed the VISITOR about somebody
             else's profile in the second person, and no key in fr.json fits because habbo.com has
             nothing to say here. -->
        <div class="md:-ml-3 md:flex md:flex-wrap md:items-start">
            <!-- `ng-if="ProfileController.profile.selectedBadges.length > 0"` — the card appears for
                 a player who has PINNED badges, not for one who merely owns some. The other three
                 gate on the list itself. -->
            {#if cardBadges.length}
                {@render card('badges', TEASERS.badges, t('PROFILE_BADGES_TITLE'), '', badgeItems)}
            {/if}

            {#if friends.length}
                <!-- `.profile__friends__count`: habbo.com's own "({{current}} de {{all}})". -->
                {@render card('friends', TEASERS.friends, t('PROFILE_FRIENDS_TITLE'),
                    t('PROFILE_FRIENDS_COUNT', {current: Math.min(FIVE, friends.length), all: friends.length}), friendItems)}
            {/if}

            {#if rooms.length}
                {@render card('rooms', TEASERS.rooms, t('PROFILE_ROOMS_TITLE'), '', roomItems)}
            {/if}

            {#if groups.length}
                {@render card('groups', TEASERS.groups, t('PROFILE_GROUPS_TITLE'), '', groupItems)}
            {/if}
        </div>
    {/if}
</main>

<!-- `.profile__card__wrapper--<kind>` > `.profile__card__aligner` > `.profile__card`, all four
     identical but for the illustration and the list. -->
{#snippet card(kind: IProfileListKind, teaser: string, title: string, count: string, items: Snippet)}
    <div class="relative mt-[140px] pb-3 md:w-1/2 md:pl-3">
        <img src={teaser} alt="" class="pointer-events-none absolute -top-[140px] left-0 h-[140px] [image-rendering:pixelated] md:left-3" />

        <!-- `.profile__card`: a bordered plate, no rounding, and the title is CENTRED
             (`.profile__card__title{margin:0 0 12px;text-align:center}`). -->
        <div class="border-[3px] border-card-line bg-card px-6 py-3 shadow-card">
            <h2 class="m-0 mb-3 text-center">
                {title}{#if count}<span class="ml-1.5 text-base text-ink">{count}</span>{/if}
            </h2>

            <!-- `.item-list--grid .item`: 50% a row, 33% from 532px, 20% from 1199px. -->
            <ul class="flex flex-wrap">{@render items()}</ul>

            <!-- `.profile__card__footer{border-top:1px solid #2a9cde;padding:12px 0 0;text-align:center}`
                 holding `.profile-modal__link` (20px, uppercase, the arrow pinned right in 22px). -->
            <div class="mt-3 border-t border-rule pt-3 text-center">
                <button type="button" onclick={() => (opened = kind)}
                        class="relative inline-block pr-[22px] font-condensed text-xl leading-7 text-white uppercase">
                    {t('SEE_ALL')}
                    <Sprite name="profileMore" className="absolute top-1/2 right-0 -translate-y-1/2" />
                </button>
            </div>
        </div>
    </div>
{/snippet}

<!-- `.item-list--grid .item__title` is #7ecaee and centred — but `a[href] .item__title` turns it
     white, so only the badges (the one list whose items link nowhere) keep the blue. And
     `.item-list--grid .item__description{display:none}`: the occupancy and the group motto below
     belong to the stacked list, not to this one.

     `overflow-hidden` is habbo.com's own on that rule and it is load-bearing: a title with no space
     in it — a badge whose label falls back to its CODE, `ACH_RoomDecoFurniCount5` — does not wrap,
     overflows its fifth of the row and lands on top of its neighbours. The grid clips; the modal
     breaks the word instead (`.item-list--stacked .item__title{word-break:break-all}`), which is
     why the same string reads correctly there. -->
{#snippet badgeItems()}
    {#each cardBadges as badge (badge.code)}
        <li class="w-1/2 pb-3 text-center xs:w-1/3 xl:w-1/5">
            <span class="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full border-[3px] border-card-line">
                <img src={badgeUrl(badge.code)} alt="" width="40" height="40" onerror={hideOnError} />
            </span>
            <span class="mt-1.5 block overflow-hidden px-1.5 text-ink">{badgeName(texts, badge.code)}</span>
        </li>
    {/each}
{/snippet}

{#snippet friendItems()}
    {#each cardFriends as friend (friend.uniqueId)}
        <li class="w-1/2 pb-3 text-center xs:w-1/3 xl:w-1/5">
            <a href="/profile/{friend.name}" use:link class="block hover:border-b-0">
                <Avatar figure={friend.figureString} well={60} className="mx-auto" />
                <span class="mt-1.5 block overflow-hidden px-1.5">{friend.name}</span>
            </a>
        </li>
    {/each}
{/snippet}

<!-- `.room-icon`: a 90px round frame holding `room.thumbnailUrl` — the owner's in-game PHOTO, which
     nothing here answers yet (see the note in lib/config.ts).

     DEVIATION: habbo.com draws no default behind it, so a room with no photo is an empty circle.
     Here EVERY room has no photo until the camera is ported, so the empty circle would be the
     permanent state rather than an occasional one, and five blank wells read as a broken page. The
     default plate the two other screens already use goes in instead — the same 110px sprite, which
     is the size `.room-icon__thumbnail` is positioned for at -10,-10. -->
{#snippet roomItems()}
    {#each cardRooms as room (room.id)}
        <li class="w-1/2 pb-3 text-center xs:w-1/3 xl:w-1/5">
            <a href="/room/{room.id}" use:link class="block hover:border-b-0">
                <span class="mx-auto flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full border-[3px] border-card-line">
                    <Sprite name="roomThumbnail" className="shrink-0 scale-[0.65]" />
                </span>
                <span class="mt-1.5 block overflow-hidden px-1.5">{room.name}</span>
            </a>
        </li>
    {/each}
{/snippet}

<!-- groups: the group's OWN room, not a group page — habbo.com has none. -->
{#snippet groupItems()}
    {#each cardGroups as group (group.id)}
        <li class="w-1/2 pb-3 text-center xs:w-1/3 xl:w-1/5">
            <a href="/room/{group.roomId}" use:link class="block hover:border-b-0">
                <span class="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full border-[3px] border-card-line">
                    <img src={groupBadgeUrl(group.badgeCode)} alt="" width="40" height="40" onerror={hideOnError} />
                </span>
                <span class="mt-1.5 block overflow-hidden px-1.5">{group.name}</span>
            </a>
        </li>
    {/each}
{/snippet}

<!-- `.profile__joined` + `.profile__hearts` -->
{#if user}
    <footer class="mx-auto max-w-[1200px] px-3 py-6 text-center">
        <h2 class="m-0">{t('PROFILE_JOINED', {date: joined(user.memberSince)})}</h2>
        <div class="mt-3 flex justify-center gap-1.5">
            <Sprite name="heart" />
            <Sprite name="heart" />
            <Sprite name="heart" />
        </div>
    </footer>
{/if}

<!-- `habbo-profile-modal`: one component for all four lists, because habbo.com has one — the type
     picks which list renders inside it and which `PROFILE_<TYPE>_TITLE` it carries. -->
{#if opened}
    <ProfileListModal kind={opened} texts={texts}
                      title={t(`PROFILE_${opened.toUpperCase()}_TITLE`)}
                      badges={badges} friends={friends} rooms={rooms} groups={groups}
                      onClose={() => (opened = '')} />
{/if}
