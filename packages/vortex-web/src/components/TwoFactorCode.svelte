<script lang="ts">
    // `common/form/twofactor-code/twofactor-code.html` and the `habboTwoFactorCode` component's own
    // controller. A 2FA code on habbo.com is SIX single-character boxes, never one field:
    //
    //   <div class="twofactorcode">
    //     <input ng-repeat="n in $ctrl.inputs track by $index" class="form__input form__input--twofactorcode">
    //
    //   .twofactorcode                { display:flex }
    //   .form__input--twofactorcode   { width:48px; height:62px; font-size:24px; font-weight:bolder;
    //                                   margin-left:6px; margin-bottom:6px }
    //
    // Its three handlers are ported as they are written, because each one is a behaviour a visitor
    // feels:
    //
    //   onKeyup   more than one character keeps only the first, then the focus walks RIGHT
    //   onKeydown backspace on an EMPTY box clears the box before it and walks LEFT
    //   onPaste   a pasted code fills all six at once and lands the focus on the last one filled
    //
    // habbo.com moves focus with `nextElementSibling` / `previousElementSibling` and, for the paste,
    // `target.parentElement.children[n]`. Same here — the row is the sibling list.
    let {value = $bindable('')}: {value?: string} = $props();

    let inputs = $state<string[]>(Array(6).fill(''));

    /** Both callers write the model the same way habbo.com does: the six boxes, joined. */
    function publish(): void
    {
        value = inputs.join('');
    }

    function onKeyup(index: number, event: KeyboardEvent & {currentTarget: HTMLInputElement}): void
    {
        const box = event.currentTarget;
        let typed = box.value;

        if(typed.length > 1)
        {
            typed = typed[0];
            event.preventDefault();
        }

        inputs[index] = typed;
        publish();

        // habbo.com defers this through `$timeout`, i.e. after the digest has written the box back.
        // The same reason applies here: `value={inputs[index]}` is re-applied on this tick, and
        // focusing before that leaves the caret in a box whose content is about to change.
        if(typed && index < 5)
        {
            setTimeout(() => (box.nextElementSibling as HTMLInputElement | null)?.focus());
        }
    }

    function onKeydown(index: number, event: KeyboardEvent & {currentTarget: HTMLInputElement}): void
    {
        const box = event.currentTarget;

        // Only on an ALREADY empty box: the first backspace clears the character under the caret,
        // the second one takes the box before it with it.
        if(event.key !== 'Backspace' || inputs[index])
        {
            return;
        }

        if(index > 0)
        {
            inputs[index - 1] = '';
            publish();

            setTimeout(() => (box.previousElementSibling as HTMLInputElement | null)?.focus());
        }

        event.preventDefault();
    }

    function onPaste(event: ClipboardEvent & {currentTarget: HTMLInputElement}): void
    {
        const pasted = (event.clipboardData?.getData('text/plain') ?? '').split('').slice(0, 6);
        const row = event.currentTarget.parentElement;

        inputs = Array(6).fill('');

        for(let index = 0; index < pasted.length; index++)
        {
            inputs[index] = pasted[index];
        }

        publish();
        event.preventDefault();

        setTimeout(() => (row?.children[pasted.length - 1] as HTMLInputElement | null)?.focus());
    }
</script>

<div class="flex">
    {#each inputs as box, index (index)}
        <!-- `.form__input` with the twofactorcode override on top of it: the same sunken light box
             as every other field, at 48x62 with a 24px `bolder` character in it. Its focus is NOT
             the site's — `--twofactorcode:focus` sets `#007bff` and a 3.2px glow over the base
             rule's `#0074a6`, and that later declaration is the one that wins. -->
        <input value={box}
               onkeyup={(event) => onKeyup(index, event)}
               onkeydown={(event) => onKeydown(index, event)}
               onpaste={onPaste}
               aria-label={String(index + 1)}
               class="mb-1.5 ml-1.5 h-[62px] w-12 rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-2xl [font-weight:bolder] text-field-ink shadow-field focus:border-[#007bff] focus:bg-white focus:shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)] focus:outline-none" />
    {/each}
</div>
