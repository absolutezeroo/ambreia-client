<script lang="ts">
    // `common/message-container/message-container.html` — habbo.com's status block, the thing every
    // settings page leads with and this port was drawing as an ordinary panel:
    //
    //   habbo-message-container { background:#103960; border-radius:3px; padding:24px; margin-bottom:24px }
    //   .message-container      { min-height:50px; padding-left:74px }   (62 on narrow screens)
    //   [type=…] ::before       a WHITE 50px disc at left:0/top:0, hard-shadowed
    //   [type=…] ::after        the mark inside it, out of the sprite
    //
    // The disc is white and the mark sits on it — an orange "!", a tick, or one of the two 2FA
    // padlocks — which is why the box reads as a status and not as a paragraph in a box.
    import type {Snippet} from 'svelte';
    import Sprite from './Sprite.svelte';
    import type {ISpriteName} from '../lib/sprite.js';

    // habbo.com's own four `type` values. It indexes MARKS below, and a fifth name used to fall
    // through to the exclamation silently — a box claiming a state it was not asked for.
    let {type = 'exclamation', className = '', children}:
    {
        type?: 'exclamation' | 'check' | '2fa-off' | '2fa-on';
        className?: string;
        children: Snippet;
    } = $props();

    // Each mark's offset inside the disc, from the ::after rules (margin-left / top).
    const MARKS: Record<string, {name: ISpriteName; left: number; top: number}> = {
        exclamation: {name: 'statusExclamation', left: 20, top: 2.5},
        check: {name: 'statusCheck', left: 14, top: 11.5},
        '2fa-off': {name: 'status2faOff', left: -1, top: -3},
        '2fa-on': {name: 'status2faOn', left: -1, top: -3},
    };

    const mark = $derived(MARKS[type] ?? MARKS.exclamation);
</script>

<div class="mb-6 overflow-hidden rounded-[3px] bg-box p-6 {className}">
    <section class="relative min-h-[50px] pl-[62px] xs:pl-[74px]">
        <span class="absolute top-0 left-0 h-[50px] w-[50px] rounded-full bg-white shadow-btn"></span>
        <span class="absolute block" style="left:{mark.left}px;top:{mark.top}px">
            <Sprite name={mark.name} />
        </span>

        {@render children()}
    </section>
</div>
