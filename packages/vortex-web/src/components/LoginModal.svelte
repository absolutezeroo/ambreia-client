<script lang="ts">
    // `security/login/login-modal.html`, which is four elements and nothing else:
    //
    //   <div class="login">
    //     <button class="modal__close">          the sprite X, absolute right 12 / top 11
    //     <h3 class="modal__title">              #0e3955 bar, 42px line, CENTRED, NOT uppercase
    //     <div class="modal__content">           max-width 280, margin 24px auto 110px
    //       <habbo-login-form>
    //
    // The colours are the site's own and none of them are the greys this port first used:
    //   backdrop      #0c3a65 at 90% — the PAGE navy, not black
    //   .modal-content #0b6395, 3px #2685bc border, 10px radius, shadow 0 1px 2px
    //   .modal__title  #0e3955, 8px radius, text-shadow 0 1px #000
    //
    // The dialog is the DEFAULT size — `.modal-dialog { margin: 30px auto; max-width: 500px }`. The
    // login modal never asks for `.modal-sm` (400px), and 400 is visibly too narrow for the social
    // block above the fields.
    import Modal from './Modal.svelte';
    import LoginForm from './LoginForm.svelte';
    import {t} from '../lib/i18n.js';

    let {onClose} = $props();
</script>

<!-- The DEFAULT size, as the comment above says and as `loginModal.open()` confirms — it passes no
     `size`, so neither `.modal-sm` nor `.modal-lg` applies. This had been shipping 400. -->
<Modal title={t('LOGIN')} {onClose}>
    <!-- `.modal__content`: a 280px column, 24px down from the title band and 110px clear of the
         dialog's bottom edge. -->
    <div class="mx-auto mt-6 mb-12 w-full max-w-[280px] px-3">
        <LoginForm modal onDone={onClose} />
    </div>
</Modal>
