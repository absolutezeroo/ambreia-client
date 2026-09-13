<script lang="ts">
    // `habbo-password-toggle-mask`: a password field with the show/hide eye inside it. Two things
    // come from the stylesheet — the input reserves 35px on its right for the icon
    // (`[habbo-password-toggle-mask]{padding-right:35px}`) and the eye sits at right 12 / top 12.1,
    // with a second sprite cut for the revealed state.
    //
    // A field that failed validation takes its own border, darker than the error popover:
    // `#903352`, `#ae1a50` when focused.
    import Sprite from './Sprite.svelte';

    let {
        label = '',
        name = undefined,
        value = $bindable(''),
        invalid = false,
        autocomplete = 'current-password',
        className = '',
    }: {
        label?: string;
        name?: string;
        value?: string;
        invalid?: boolean;
        /** The browser's own vocabulary — 'off' for a security answer, which is not a password. */
        autocomplete?: AutoFill;
        className?: string;
    } = $props();

    let shown = $state(false);
</script>

<div class="relative {className}">
    {#if label}
        <label class="block text-white" for={name}>{label}</label>
    {/if}

    <div class="relative">
        <input
            id={name}
            {name}
            {autocomplete}
            type={shown ? 'text' : 'password'}
            bind:value
            class="w-full rounded-[5px] border-[3px] bg-field py-[5px] pr-[35px] pl-3 text-base leading-[1.2] text-field-ink shadow-field focus:bg-white focus:outline-none {invalid ? 'border-error-line focus:border-error-line-focus' : 'border-field-line focus:border-field-line-focus'}"
        />

        <button type="button" onclick={() => (shown = !shown)}
                class="absolute top-[12.1px] right-3 block" aria-label={shown ? 'Masquer' : 'Afficher'}>
            <Sprite name={shown ? 'eyeActive' : 'eye'} />
        </button>
    </div>
</div>
