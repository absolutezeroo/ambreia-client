<script lang="ts">
    // `home/messaging/discussions/discussions.html`: the home's second tab, listing the last
    // conversations — the other participant's avatar on the left, up to three messages, and a reply
    // link that hands off to the CLIENT rather than replying on the site
    // (`/hotel?link=friendlist/openchat/<id>`).
    //
    // Mocked (lib/mock.js -> DISCUSSIONS): the console lives behind the game socket. The reply link
    // is honest though — it opens the hotel, which is where the conversation actually is.
    import {link} from 'svelte-spa-router';
    import Tabs from '../components/Tabs.svelte';
    import Avatar from '../components/Avatar.svelte';
    import EmptyResults from '../components/EmptyResults.svelte';
    import {HOME_TABS} from '../lib/tabs.js';
    import {t} from '../lib/i18n.js';
    import {DISCUSSIONS} from '../lib/mock.js';
</script>

<Tabs tabs={HOME_TABS} />

<main class="mx-auto max-w-[1200px] px-3 py-6">
    <!-- `messaging.html`'s own heading. `HOME_MESSAGING_TAB` is the TAB's word ("Messages privés")
         and reads as a label above a page that already has a tab saying it. -->
    <h1>{t('MESSAGING_TITLE')}</h1>

    {#if !DISCUSSIONS.length}
        <EmptyResults key="DISCUSSIONS_EMPTY" className="py-12" />
    {:else}
        <ul>
            {#each DISCUSSIONS as discussion (discussion.id)}
                <li class="flex gap-3 border-b border-card-line py-6 last:border-0">
                    <Avatar figure={discussion.figure} well={60} />

                    <div class="min-w-0 flex-1">
                        <h6 class="mt-0 text-ink">{discussion.name} — {discussion.ago}</h6>

                        <ul>
                            {#each discussion.messages as message}
                                <li class="mb-1.5">
                                    <p class="m-0">{message.text}</p>
                                    <time class="block"><small class="text-ink">{message.at}</small></time>
                                </li>
                            {/each}
                        </ul>

                        <p><a href="/hotel" use:link class="font-condensed uppercase">Repondre dans l'hotel</a></p>
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</main>
