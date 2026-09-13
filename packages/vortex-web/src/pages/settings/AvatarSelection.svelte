<script>
    // `/settings/avatars` — `settings/avatar-selection/avatar-selection.html`:
    //
    //   <h2>Sélection d'avatar</h2>
    //   <habbo-avatar-create>   the create block
    //   <habbo-avatar-search>   a search field over the list of `habbo-avatar-selector` rows
    //
    // `.avatar-create` is `padding-left: 90px` with a 54x61 box sprite at left:0 and the green plus
    // laid over it at 32/25, the count line, and the button pushed right by `margin-left: auto`.
    // `.avatar-selector` marks the active avatar with a green tick out of the sprite (44x50 at
    // right 12) rather than with a word, and gives the others a "Sélectionner" button.
    //
    // This is real against the API — GET/POST /api/user/avatars and /api/user/avatars/select — and
    // the choice is not cosmetic: the next /api/ssotoken is issued for whichever avatar the SESSION
    // has selected, so /hotel enters as this one.
    import SettingsShell from './SettingsShell.svelte';
    import Sprite from '../../components/Sprite.svelte';
    import Avatar from '../../components/Avatar.svelte';
    import Button from '../../components/Button.svelte';
    import FormError from '../../components/FormError.svelte';
    import EmptyResults from '../../components/EmptyResults.svelte';
    import AvatarCreateModal from '../../components/AvatarCreateModal.svelte';
    import SafetyChallengeModal from '../../components/SafetyChallengeModal.svelte';
    import * as api from '../../lib/api.js';
    import {avatars, selectedId, choose} from '../../lib/session.js';
    import {t} from '../../lib/i18n.js';

    // Five per account, from `AVATAR_CREATE_MORE`'s own arithmetic on habbo.com — the emulator does
    // not publish a cap, so this is the site's number and not the server's.
    const MAX_AVATARS = 5;

    let creating = $state(false);
    let query = $state('');
    let error = $state('');

    // `avatar-create.html`'s own `open()`, and the ONE place habbo.com puts this gate:
    //
    //   o.open = function () { Session.isTrusted() ? create() : safetyLockModal.open().then(create) }
    //
    // A new avatar is the risky action a thief reaches for first — it is a new identity on the
    // hotel wearing the owner's account — so an untrusted session answers the security questions
    // before the dialog opens, and the creation follows the answer. The server refuses it too
    // (`safetylock.required` on POST /api/user/avatars); this is the half that explains why.
    let challenging = $state(false);

    async function openCreate()
    {
        try
        {
            const status = await api.getSafetyQuestions();

            if(status.configured && !status.trusted)
            {
                challenging = true;

                return;
            }
        }
        catch
        {
            // Signed out, or the route is unreachable. The server is the one that actually refuses,
            // so opening the dialog here is never the thing that lets a creation through.
        }

        creating = true;
    }

    // `byNameDescriptionOrMotto`, habbo.com's own filter on this list. Its ordering is
    // `['-lastWebAccess', 'name']`; `AvatarInfo` carries no last-access, so this falls back to the
    // name alone — and the row's "Dernière connexion" line has no time for the same reason.
    const shown = $derived($avatars
        .filter((avatar) => !query
            || `${avatar.name} ${avatar.motto ?? ''}`.toLowerCase().includes(query.toLowerCase()))
        .toSorted((a, b) => a.name.localeCompare(b.name)));

    async function select(avatar)
    {
        error = '';

        try
        {
            await choose(avatar.uniqueId);
        }
        catch(failure)
        {
            error = failure.message;
        }
    }
</script>

<SettingsShell>
    <h2 class="mt-0">{t('AVATAR_SELECTION_TITLE')}</h2>

    {#if error}
        <FormError inline>{error}</FormError>
    {/if}

    <div class="relative mb-6 flex min-h-[61px] flex-wrap items-center rounded-[3px] bg-box p-3 pl-[90px] md:flex-nowrap">
        <span class="absolute top-0 left-0 block"><Sprite name="avatarCreateBox" /></span>
        <span class="absolute top-[25px] left-8 block"><Sprite name="avatarCreatePlus" /></span>

        <p class="m-0 pr-6">
            {#if $avatars.length >= MAX_AVATARS}
                {t('AVATAR_CREATE_MAX')}
            {:else}
                {t('AVATAR_CREATE_MORE', {count: MAX_AVATARS - $avatars.length})}
            {/if}
        </p>

        <span class="w-full pt-3 text-center md:ml-auto md:w-auto md:pt-0">
            <Button disabled={$avatars.length >= MAX_AVATARS} onclick={openCreate} className="whitespace-nowrap">
                {t('AVATAR_CREATE_BUTTON')}
            </Button>
        </span>
    </div>

    <!-- `habbo-search`: the magnifier is a ::before at left 12, the clear button a ::after at
         right 12, and the input reserves 34px either side for them. -->
    <div class="relative mb-6">
        <span class="pointer-events-none absolute top-[0.5em] left-3 block"><Sprite name="searchGlass" /></span>
        <input bind:value={query} placeholder={t('SEARCH_PLACEHOLDER')}
               class="w-full rounded-[5px] border-[3px] border-field-line bg-field px-[34px] py-[5px] text-field-ink shadow-field focus:border-field-line-focus focus:bg-white focus:outline-none" />
        {#if query}
            <button type="button" onclick={() => (query = '')} class="absolute top-[0.5em] right-3 block" aria-label={t('FORM_CANCEL_LABEL')}>
                <Sprite name="searchClear" />
            </button>
        {/if}
    </div>

    <ul>
        {#each shown as avatar (avatar.uniqueId)}
            <li class="relative mb-3 flex flex-wrap items-center gap-3 rounded-[3px] bg-box p-3 {avatar.uniqueId === $selectedId ? 'flex-nowrap pr-[56px]' : ''}">
                <Avatar figure={avatar.figureString} user={avatar.name} size="m" direction={2} className="shrink-0" />

                <div class="min-w-0 flex-1">
                    <h4 class="m-0 normal-case">{avatar.name}</h4>
                    {#if avatar.motto}
                        <p class="m-0 text-sm">{avatar.motto}</p>
                    {/if}
                    <p class="m-0 text-sm text-[#999]">{t('AVATAR_SELECTION_LAST_LOGIN')}</p>
                </div>

                {#if avatar.uniqueId === $selectedId}
                    <span class="absolute top-1/2 right-3 block -translate-y-1/2"><Sprite name="avatarSelected" /></span>
                {:else}
                    <span class="w-full text-center md:ml-auto md:w-auto">
                        <Button onclick={() => select(avatar)}>{t('AVATAR_SELECTION_SELECT_BUTTON')}</Button>
                    </span>
                {/if}
            </li>
        {/each}
    </ul>

    {#if !shown.length}
        <EmptyResults className="py-6" />
    {/if}

    {#if creating}
        <AvatarCreateModal onClose={() => (creating = false)} />
    {/if}
</SettingsShell>

<!-- `.then(create)`: answering opens the dialog the visitor asked for in the first place. -->
{#if challenging}
    <SafetyChallengeModal onClose={() => (challenging = false)}
                          onDone={() => { challenging = false; creating = true; }} />
{/if}
