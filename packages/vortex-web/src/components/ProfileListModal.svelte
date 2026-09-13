<script lang="ts">
    // `profile/profile-modal/profile-modal.html` — what "Tout voir" opens on habbo.com, and this
    // port had been expanding the card in place instead:
    //
    //   <button class="modal__close">
    //   <h3 class="modal__title" translate="PROFILE_<TYPE>_TITLE">
    //   <habbo-search query="query">
    //   <div class="item-list--stacked"> the SAME four list templates as the card
    //   <habbo-empty-results ng-if="…length === 0">
    //
    // The lists are not duplicated on habbo.com: `badges.html`, `friends.html`, `rooms.html` and
    // `groups.html` each render once, and the WRAPPER's class decides the shape.
    // `.item-list--grid` stacks icon over title and hides the description;
    // `.item-list--stacked` puts them in a row at `padding:12px` with a two-tone rule between, the
    // title at 20px with `word-break:break-all`, and the description showing at 16px in #7ecaee.
    //
    // That is why the card's five items carry no description — it is the same markup under
    // `.item-list--grid .item__description{display:none}`.
    //
    // The search is habbo.com's `byNameDescriptionOrMotto`: name, description and motto, nothing
    // else. So a badge is found by its label or its explanation, a friend by their name or their
    // motto, a room or a group by either.
    import {link} from 'svelte-spa-router';
    import Modal from './Modal.svelte';
    import Sprite from './Sprite.svelte';
    import Avatar from './Avatar.svelte';
    import EmptyResults from './EmptyResults.svelte';
    import {badgeUrl, groupBadgeUrl, hideOnError} from '../lib/config.js';
    import {badgeName, badgeDescription} from '../lib/badges.js';
    import type {IBadgeTexts} from '../lib/badges.js';
    import type {IProfileBadge, IProfileFriend, IProfileGroup, IProfileRoom} from '../lib/api.js';
    import {t} from '../lib/i18n.js';

    type IProfileListKind = 'badges' | 'friends' | 'rooms' | 'groups';

    let {
        kind,
        title,
        badges = [],
        friends = [],
        rooms = [],
        groups = [],
        texts = {},
        onClose,
    }: {
        kind: IProfileListKind;
        title: string;
        badges?: IProfileBadge[];
        friends?: IProfileFriend[];
        rooms?: IProfileRoom[];
        groups?: IProfileGroup[];
        texts?: IBadgeTexts;
        onClose: () => void;
    } = $props();

    let query = $state('');

    /**
     * One shape for all four lists, because habbo.com runs ONE filter over all four. Everything the
     * row needs to draw itself travels with it — the icon included — so the markup below never has
     * to reach back into the original array to find out what it is rendering.
     */
    interface IRow
    {
        key: string;
        name: string;
        description: string;
        /** Empty when the row links nowhere: a badge, and a group with no room. */
        href: string;
        figure: string;
        badgeCode: string;
    }

    const rows = $derived<IRow[]>(
        kind === 'badges'
            ? badges.map((badge) => ({
                key: badge.code,
                name: badgeName(texts, badge.code),
                description: badgeDescription(texts, badge.code),
                href: '',
                figure: '',
                badgeCode: badge.code,
            }))
        : kind === 'friends'
            ? friends.map((friend) => ({
                key: friend.uniqueId,
                name: friend.name,
                description: friend.motto,
                href: `/profile/${encodeURIComponent(friend.name)}`,
                figure: friend.figureString,
                badgeCode: '',
            }))
        : kind === 'rooms'
            ? rooms.map((room) => ({
                key: String(room.id),
                name: room.name,
                description: room.description,
                href: `/room/${room.id}`,
                figure: '',
                badgeCode: '',
            }))
            // habbo.com links a group to its ROOM and to nothing at all when it has none: there is
            // no group page anywhere on the site.
            : groups.map((group) => ({
                key: String(group.id),
                name: group.name,
                description: group.description,
                href: group.roomId ? `/room/${group.roomId}` : '',
                figure: '',
                badgeCode: group.badgeCode,
            }))
    );

    const shown = $derived(matching(rows, query));

    function matching(all: IRow[], text: string): IRow[]
    {
        const needle = text.trim().toLowerCase();

        if(!needle)
        {
            return all;
        }

        return all.filter((row) =>
            row.name.toLowerCase().includes(needle)
            || row.description.toLowerCase().includes(needle));
    }
</script>

<!-- The row's insides, so the linked and unlinked forms are one piece of markup rather than two
     that drift. -->
{#snippet body(row: IRow)}
    <span class="shrink-0 text-center leading-none">
        {#if kind === 'friends'}
            <Avatar figure={row.figure} well={60} />
        {:else if kind === 'rooms'}
            <!-- The same plate as every other appart picture: what habbo.com shows there is a photo
                 nothing answers yet — see the note in lib/config.ts. -->
            <span class="flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full border-[3px] border-card-line">
                <Sprite name="roomThumbnail" className="shrink-0 scale-[0.65]" />
            </span>
        {:else}
            <span class="flex h-[60px] w-[60px] items-center justify-center rounded-full border-[3px] border-card-line">
                <img src={kind === 'badges' ? badgeUrl(row.badgeCode) : groupBadgeUrl(row.badgeCode)}
                     alt="" width="40" height="40" onerror={hideOnError} />
            </span>
        {/if}
    </span>

    <!-- `.item-list--stacked .item__text{padding-left:24px}`, and 12px for a friend, whose head
         already overflows its well. -->
    <span class="min-w-0 {kind === 'friends' ? 'pl-3' : 'pl-6'}">
        <!-- `word-break:break-all` is habbo.com's own, and it is what keeps a badge code with no
             spaces in it from running off the row. -->
        <span class="block font-condensed text-xl leading-tight break-all text-white">{row.name}</span>
        {#if row.description}
            <span class="mt-3 block text-base text-ink">{row.description}</span>
        {/if}
    </span>
{/snippet}

<Modal {title} {onClose}>
    <div class="px-3 pt-6 pb-3">
        <!-- `habbo-search`: magnifier left 12, clear right 12, 34px reserved either side. -->
        <div class="relative mb-3">
            <span class="pointer-events-none absolute top-[0.5em] left-3 block"><Sprite name="searchGlass" /></span>
            <input bind:value={query} placeholder={t('SEARCH_PLACEHOLDER')}
                   class="w-full rounded-[5px] border-[3px] border-field-line bg-field px-[34px] py-[5px] text-field-ink shadow-field focus:border-field-line-focus focus:bg-white focus:outline-none" />
            {#if query}
                <button type="button" onclick={() => (query = '')} class="absolute top-[0.5em] right-3 block" aria-label={t('FORM_CANCEL_LABEL')}>
                    <Sprite name="searchClear" />
                </button>
            {/if}
        </div>

        {#if !shown.length}
            <EmptyResults />
        {:else}
            <!-- `.item-list--stacked .item:not(:last-child)` is TWO lines, not one: a #2685bc border
                 and a #0b6395 line a pixel below it, which is what gives the divider its engraved
                 edge. A single border reads flat — the same detail as the purse's rule.

                 The list scrolls inside the modal, which is what habbo.com's own
                 `infinite-scroll-container="'.modal'"` is attached to. -->
            <ul class="max-h-[60vh] overflow-y-auto">
                {#each shown as row (row.key)}
                    <li class="relative border-b border-card-line last:border-0 after:absolute after:-bottom-[2px] after:left-0 after:h-px after:w-full after:bg-[#0b6395] after:content-[''] last:after:hidden">
                        {#if row.href}
                            <a href={row.href} use:link class="flex items-center p-3 hover:border-b-0 hover:bg-[#0074a6] active:bg-[#2685bc]">
                                {@render body(row)}
                            </a>
                        {:else}
                            <div class="flex items-center p-3">
                                {@render body(row)}
                            </div>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</Modal>
