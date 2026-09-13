<script lang="ts">
    // `.form__fieldset`, and its boxed variant. habbo.com's settings forms alternate the two — plain,
    // boxed, plain, boxed — which is what gives those pages their striped look:
    //
    //   .form__fieldset       { margin: 12px 0; padding: 0 12px }
    //   .form__fieldset--box  { background:#103960; border-radius:3px; padding:12px }
    //
    // Each carries an <h4> title and, usually, a paragraph of help above the controls.
    let {title = '', help = '', box = false, className = '', children} = $props();
</script>

<fieldset class="my-3 {box ? 'rounded-[3px] bg-box p-3' : 'px-3'} {className}">
    {#if title}
        <h4 class="mt-0">{title}</h4>
    {/if}

    {#if help}
        <p>{@html help}</p>
    {/if}

    {@render children()}
</fieldset>
