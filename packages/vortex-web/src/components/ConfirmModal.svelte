<script lang="ts">
    // "Are you sure?", as a dialog of the site's own rather than the browser's. Two places reached
    // for `window.confirm` — the feed's delete and the trusted-locations reset — which is one grey
    // Chrome box in the middle of a hotel, and the site has had `Modal` all along.
    //
    // The body is full width and NOT `.modal__content`'s 280px column, because the six 2FA boxes
    // are 324px wide together and would hang out of it. `TwoFactorDisableModal` already lays a
    // confirmation and a code out that way, and this is that shape made reusable.
    //
    // The component owns the whole exchange — busy, the second factor, the error line — so a caller
    // is a `confirm` function and nothing else. That is deliberate: the MFA retry below is fiddly
    // enough that having it written once beats having it written at every call site, which is how
    // the site ended up with two native confirms in the first place.
    import type {Snippet} from 'svelte';
    import Modal from './Modal.svelte';
    import Button from './Button.svelte';
    import TwoFactorCode from './TwoFactorCode.svelte';
    import FormError from './FormError.svelte';
    import * as api from '../lib/api.js';
    import {t} from '../lib/i18n.js';

    let {title, variant = 'red', confirm, onClose, onDone = undefined, children}:
    {
        title: string;
        /** `Button`'s ramp: crimson for the ones that take something away, which is most of these. */
        variant?: 'blue' | 'green' | 'red';
        /**
         * What OK does. It is handed the code once the server has asked for one, and `undefined`
         * until then. Throwing keeps the dialog open and shows the message; returning closes it.
         */
        confirm: (code: string | undefined) => Promise<unknown>;
        onClose: () => void;
        onDone?: (() => void) | undefined;
        children: Snippet;
    } = $props();

    let code = $state('');
    let needsCode = $state(false);
    let error = $state('');
    let busy = $state(false);

    async function run(): Promise<void>
    {
        if(busy || (needsCode && code.length !== 6))
        {
            return;
        }

        busy = true;
        error = '';

        try
        {
            await confirm(needsCode ? code : undefined);

            // Closed BEFORE the caller is told, because what the caller does with the news is
            // often to remove the thing the dialog was opened from — and this component goes with
            // it. Writing its own state after that would be writing to a corpse.
            onClose();
            onDone?.();
        }
        catch(failure)
        {
            // The second factor is asked for the way the rest of the site asks for it: the action
            // is attempted, the server refuses with `mfa_required`, and the boxes appear. Nothing
            // queries whether the account has a factor first — that would cost a round trip on
            // every dialog and tell an onlooker which accounts are protected.
            //
            // A WRONG code comes back as `invalid_code`, which is not `mfa_required`, so it lands
            // below with the translated "Code incorrect" and the boxes stay where they are.
            if(api.needsMfa(failure))
            {
                needsCode = true;
                error = '';
            }
            else
            {
                error = (failure as Error)?.message ?? '';
            }
        }
        finally
        {
            busy = false;
        }
    }
</script>

<Modal {title} {onClose}>
    <div class="px-3 pt-3 pb-6">
        <div class="m-[10px]">
            <p class="m-0">{@render children()}</p>
        </div>

        {#if needsCode}
            <!-- Centred under the question, as `TwoFactorDisableModal` centres it: the row is wider
                 than the text column above it and reads as a step of its own. -->
            <div class="mt-6 flex justify-center">
                <p class="m-0">{t('TWO_FACTOR_AUTHENTICATION_ENTER_AUTH_CODE')}</p>
            </div>
            <div class="flex justify-center">
                <TwoFactorCode bind:value={code} />
            </div>
        {/if}

        {#if error}
            <div class="m-[10px]">
                <FormError inline>{error}</FormError>
            </div>
        {/if}

        <!-- `.form__footer`: the cancel is a link pinned left and vertically centred, the action a
             button floated right. Same as every dialog on the site. -->
        <div class="relative mt-6 after:table after:clear-both after:content-['']">
            <a href={'#'} onclick={(event) => { event.preventDefault(); onClose(); }}
               class="absolute top-1/2 left-0 -mt-[0.5em] block leading-none text-white hover:border-b hover:border-solid">
                {t('FORM_CANCEL_LABEL')}
            </a>

            <Button {variant} disabled={busy || (needsCode && code.length !== 6)} onclick={run} className="float-right mb-3">
                {t('OK_BUTTON')}
            </Button>
        </div>
    </div>
</Modal>
