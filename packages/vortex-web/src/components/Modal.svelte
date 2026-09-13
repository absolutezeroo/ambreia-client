<script lang="ts">
    // The shell every dialog on habbo.com shares, and which three components here had each copied
    // out of `login-modal.html` in turn. One element per rule:
    //
    //   .modal-backdrop  the PAGE navy #0c3a65 at 90%, fixed, behind the dialog
    //   .modal-dialog    max-width 500 by default — `.modal-sm` 400, `.modal-lg` 600
    //   .modal-content   #0b6395, a 3px #2685bc border, 10px radius
    //   .modal__close    the sprite X, absolute right 12 / top 11
    //   .modal__title    #0e3955, 8px radius, 42px line, CENTRED, `text-transform: initial`
    //
    // The BODY is deliberately not styled here. `.modal__content` (`margin:24px auto 110px;
    // max-width:280px`) is a narrow column that suits a login form and nothing else, and habbo.com
    // applies it per dialog — the 2FA register modal asks for `class="modal__content.modal-lg"`,
    // a literal class with a dot in it that matches no rule, so its body is full-width. Each caller
    // wraps its own children.
    import type {Snippet} from 'svelte';
    import Sprite from './Sprite.svelte';
    import {t} from '../lib/i18n.js';

    let {title = '', width = 500, onClose, children}:
    {
        title?: string;
        /** `.modal-dialog`'s max-width: 500 by default, 400 for `.modal-sm`, 600 for `.modal-lg`. */
        width?: number;
        onClose: () => void;
        children: Snippet;
    } = $props();
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && onClose()} />

<div class="fixed inset-0 z-[1040] overflow-y-auto"
     onclick={(event) => event.target === event.currentTarget && onClose()}
     role="presentation">
    <div class="fixed inset-0 bg-page opacity-90"></div>

    <!-- `.modal-dialog` is full-bleed below 767px — `height:100%; width:100%` and no margin at all
         — and only from 767 does it become `margin:30px auto` with a max-width. The `max-width`
         needs no breakpoint of its own: the narrowest it ever is (400) is still wider than the
         widest screen that gets the full-bleed form.

         No horizontal padding, because habbo.com has none on either `.modal` or `.modal-dialog`:
         the 500 is the CARD's width. Padding it in by 12px either side made the dialog 476 wide,
         and 24px is the whole margin the close button has — which is why the longest title
         ("DÉSACTIVER L'AUTHENTIFICATION À DEUX FACTEURS") ran under the X. -->
    <div class="relative mx-auto w-full md:my-[30px]" style="max-width:{width}px">
        <div class="relative rounded-[10px] border-[3px] border-card-line bg-card shadow-card">
            <button type="button" onclick={onClose} class="absolute top-[11px] right-3 block" aria-label={t('FORM_CANCEL_LABEL')}>
                <Sprite name="close" />
            </button>

            <h3 class="m-0 rounded-lg bg-panel-head text-center leading-[42px] normal-case [text-shadow:0_1px_#000]">
                {title}
            </h3>

            {@render children()}
        </div>
    </div>
</div>
