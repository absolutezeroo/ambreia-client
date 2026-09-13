<script>
    // habbo.com has three button ramps and they differ only in colour: blue for everything
    // (`.login-form__button`, `.claim__button`), green for entering the hotel and for a form's own
    // submit inside a dialog (`.claim__button--primary`, `.two-factor-auth__auth-button`), and
    // crimson for the one that takes something away (`.two-factor-auth__disable-button`,
    // `.account-security__disable`). All three press DOWN 2px on :active and drop their shadow from
    // 3px to 1px at the same time, which is what makes them feel physical — a colour-only :active
    // state is the usual tell that a Habbo button was rebuilt from a screenshot.
    let {
        variant = 'blue',
        type = 'button',
        href = '',
        disabled = false,
        className = '',
        onclick = undefined,
        children,
    } = $props();

    const RAMP = {
        blue: 'bg-btn border-btn-line hover:bg-btn-hover hover:border-btn-line-hover active:bg-btn-active active:border-btn-line-active disabled:bg-btn-active disabled:border-btn-line-active',
        green: 'bg-play border-play-line hover:bg-play-hover hover:border-play-line-hover active:bg-play-active active:border-play-line-active disabled:bg-play-active disabled:border-play-line-active',
        red: 'bg-danger border-danger-line hover:bg-danger-hover hover:border-danger-line-hover active:bg-danger-active active:border-danger-line-active disabled:bg-danger-active disabled:border-danger-line-active',
    };

    // `hover:border-b-2` cancels the site-wide `a:hover { border-bottom: 1px solid }` for the link
    // form — habbo.css does the same, one selector at a time, for every element that is a link but
    // reads as a button.
    const base = 'inline-block border-2 rounded-[5px] px-6 py-3 text-center text-base leading-[1.2] font-condensed uppercase text-white shadow-btn hover:border-b-2 active:translate-y-[2px] active:shadow-btn-active disabled:opacity-40';
</script>

{#if href}
    <a {href} class="{base} {RAMP[variant]} {className}">{@render children()}</a>
{:else}
    <button {type} {disabled} {onclick} class="{base} {RAMP[variant]} {className}">{@render children()}</button>
{/if}
