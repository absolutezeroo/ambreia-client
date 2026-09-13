<script lang="ts">
    // `.form__field` + `.form__label` + `.form__input`. The input is a light box on the dark page
    // with an inset highlight along its top edge (--shadow-field), which is the detail that makes
    // the field read as sunken rather than pasted on.
    let {
        label = '',
        type = 'text',
        value = $bindable(''),
        placeholder = '',
        autocomplete = undefined,
        name = undefined,
        maxlength = undefined,
        required = false,
        className = '',
    } = $props();
</script>

<div class="relative {className}">
    {#if label}
        <label class="block text-white" for={name}>{label}</label>
    {/if}
    <input
        id={name}
        {name}
        {type}
        {placeholder}
        {autocomplete}
        {maxlength}
        {required}
        bind:value
        class="w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-base leading-[1.2] text-field-ink shadow-field placeholder:text-[#888] focus:border-field-line-focus focus:bg-white focus:outline-none"
    />
</div>
