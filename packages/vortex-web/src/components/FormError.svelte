<script lang="ts">
    // `.form__popover--error` — habbo.com never puts a line of red text under a field. It puts a
    // crimson card there, with a triangle pointing up at the field it belongs to and a hard 4px
    // shadow under it:
    //
    //   .form__popover--error { background:#b00049; border-radius:3px; color:#fff; padding:12px;
    //                           margin-top:12px; filter: drop-shadow(0 4px 0 rgba(0,0,0,.3)) }
    //   .form__popover--error::before { an 8px triangle in the same crimson, left:12px, top:-8px }
    //
    // From 767px the card moves out to the RIGHT of the field (`left:100%; margin-left:24px`) and
    // the triangle is hidden — except inside a modal, where it stays under the field
    // (`.modal .form__popover`), which is the `inline` prop.
    let {inline = false, children} = $props();
</script>

<div class="relative mt-3 rounded-[3px] bg-error p-3 text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]
            before:absolute before:top-[-8px] before:left-3 before:block before:border-x-8 before:border-b-8 before:border-x-transparent before:border-b-error before:content-['']
            {inline ? '' : 'md:absolute md:top-[-6px] md:left-full md:z-[3] md:mt-0 md:ml-6 md:w-[calc(100%+12px)] md:before:hidden'}">
    {@render children()}
</div>
