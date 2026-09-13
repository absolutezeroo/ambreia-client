<script lang="ts">
    // `community/rooms/rooms.html`: the page-header band, then a flat list of `.room-item`. The
    // geometry is habbo.com's own and nothing about it is a list-with-dividers:
    //
    //   .room-item            { min-height: 110px; padding-left: 122px; position: relative; margin-bottom: 24px }
    //   .room-item__thumbnail { 110x110 at left:0/top:0, box-shadow 3px 3px, background #6796b1 }
    //   .room-item__thumbnail::before  the DEFAULT appart picture, straight out of the sprite
    //   .room-item__title     { font-size: 24px; margin: 0; text-transform: NONE }
    //   .room-item__description { font-size: 14px; margin: 6px 0 }
    //   .room-item__owner--user::before  a 46px teal circle at left:0/top:6px, behind the head
    //
    // The title keeping its own case matters: an appart called "Ndrangheta, Grande Palazzo" is not
    // shouted on habbo.com, and uppercasing every name is immediately wrong.
    //
    // Real since 2026-09-11: GET /api/public/rooms, the busiest visible apparts first. A room whose
    // door is invisible is not in it — the server excludes it, because a web page that answered for
    // one would walk around the door the client enforces.
    import {link} from 'svelte-spa-router';
    import CommunityShell from './CommunityShell.svelte';
    import PageHeader from '../../components/PageHeader.svelte';
    import Sprite from '../../components/Sprite.svelte';
    import Avatar from '../../components/Avatar.svelte';
    import EmptyResults from '../../components/EmptyResults.svelte';
    import * as api from '../../lib/api.js';
    import type {IRoomSummary} from '../../lib/api.js';
    import {t} from '../../lib/i18n.js';

    let rooms = $state<IRoomSummary[]>([]);
    let loading = $state(true);

    $effect(() =>
    {
        let cancelled = false;

        void api.getRooms()
            .then((answer) => !cancelled && (rooms = answer.items ?? []))
            .catch(() => !cancelled && (rooms = []))
            .finally(() => !cancelled && (loading = false));

        return () => (cancelled = true);
    });
</script>

<CommunityShell>
<PageHeader title={t('ROOMS_TITLE')} description={t('ROOMS_DESCRIPTION')} illustration />

<section class="mx-auto max-w-[1200px] px-3 py-6">
    {#each rooms as room (room.id)}
        <div class="relative mb-6 min-h-[110px] pl-[122px]">
            <a href="/room/{room.id}" use:link class="absolute top-0 left-0 block hover:border-b-0">
                <!-- `.room-item__thumbnail::before` IS the picture here: the default plate off the
                     sprite sheet. `__image` would lay the owner's photo over it at 0,0, and there is
                     no photo — see the note in lib/config.ts. -->
                <span class="block bg-[#6796b1] shadow-[3px_3px_rgba(0,0,0,0.3)]">
                    <Sprite name="roomThumbnail" />
                </span>
            </a>

            <a href="/room/{room.id}" use:link class="block hover:border-b-0">
                <h2 class="m-0 text-2xl normal-case">{room.name}</h2>
            </a>

            <p class="my-1.5 text-sm">{room.description}</p>

            <!-- `<habbo-avatar user="…">`: the head, then the name as an `<h6 class="avatar__title">`
                 — condensed, 16px, white, not body text — with `.room-item__owner--user
                 .avatar__title` putting 3px between them, not the 12px this had.

                 There is NO visitor count on habbo.com's card. `usersNow` is what the gallery is
                 ORDERED by, which is where it earns its place; printing it here was invented. -->
            <div class="relative block">
                <a href="/profile/{room.ownerName}" use:link class="flex items-center gap-[3px] hover:border-b-0">
                    <Avatar user={room.ownerName} well={46} />
                    <h6 class="m-0 truncate">{room.ownerName}</h6>
                </a>
            </div>
        </div>
    {/each}

    {#if !loading && !rooms.length}
        <EmptyResults className="py-12" />
    {/if}
</section>
</CommunityShell>
