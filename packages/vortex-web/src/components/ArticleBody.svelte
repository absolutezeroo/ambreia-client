<script lang="ts">
    // An article body, rendered from the emulator's closed block vocabulary
    // (Vortex.Database/Entities/Web/WebArticleBody.cs):
    //
    //   { type: 'p',   text }              a paragraph
    //   { type: 'h',   text }              a sub-heading
    //   { type: 'img', src, caption? }     a picture, `src` a path under c_images
    //   { type: 'btn', label, href }       a button
    //   { type: 'hr' }                     a separator
    //
    // There is NO html block, and that is the point: a body is typed JSON, never markup, so nothing
    // a writer pastes can turn into script on the public site. This renderer must therefore never
    // reach for `{@html}` — doing so would re-open by hand the hole the vocabulary closes, and it
    // would fail silently, because none of the five types carries markup to begin with.
    //
    // An unknown type cannot arrive: the server refuses to store one rather than let an article be
    // saved half-visible. If one somehow does, it is skipped rather than rendered as `[object]`.
    import {link} from 'svelte-spa-router';
    import {IMAGES} from '../lib/config.js';

    // One rendered block of an article. `href` is the field an editor controls that the browser will
    // EXECUTE, so it stays `unknown` rather than `string`: nothing here may assume the shape the API
    // promised, and both guards below re-test it themselves.
    interface IArticleBlock
    {
        type?: string;
        text?: string;
        href?: unknown;
        src?: string;
        caption?: string;
        label?: string;
    }

    // `unknown[]`, deliberately. The API declares this field as `JsonNode[]` — the emulator hands
    // the blocks through as raw JSON — so the generated type says nothing at all about their shape,
    // and pretending otherwise at the prop boundary would move the lie one file up. This component
    // is the one place that knows what a block looks like, so it is the one place that narrows, and
    // `safe()` re-validates the only field that matters anyway.
    let {body = []}: {body?: unknown[]} = $props();

    // `#/…` is an in-site route and goes through the router; everything else is a plain link.
    // Both guards are type predicates, not plain booleans. That is the point of keeping `href` as
    // `unknown`: the only way to reach `.slice(1)` or an `href=` attribute is THROUGH one of them,
    // so a future branch that renders a link without asking cannot compile.
    function internal(href: unknown): href is string
    {
        return typeof href === 'string' && href.startsWith('#/');
    }

    // The same allowlist `WebArticleBody.IsAllowedHref` enforces on the way IN, applied again on the
    // way OUT. Not redundant: an href is the one field an editor controls that the browser will
    // EXECUTE, so `javascript:` reaching a rendered <a> is script on the public site. Validating it
    // in one place only makes the whole site's safety depend on that one place never being bypassed
    // — a direct DB write, a second writer, a relaxed rule — and this component cannot see any of
    // those. A block whose href fails renders as plain text rather than as a link.
    function safe(href: unknown): href is string
    {
        if(typeof href !== 'string' || !href || href.length > 2048)
        {
            return false;
        }

        // `//host` is protocol-relative, not a path — the server refuses it and so does this.
        if(href.startsWith('//'))
        {
            return false;
        }

        return href.startsWith('#/')
            || href[0] === '/'
            || /^https?:\/\//i.test(href);
    }
</script>

{#each body as raw, index (index)}
    {@const block = raw as IArticleBlock}
    {#if block.type === 'p'}
        <p>{block.text}</p>
    {:else if block.type === 'h'}
        <h3>{block.text}</h3>
    {:else if block.type === 'img'}
        <figure class="my-6">
            <img src="{IMAGES}{block.src}" alt={block.caption ?? ''}
                 class="w-full shadow-[3px_3px_rgba(0,0,0,0.3)] [image-rendering:auto]" />
            {#if block.caption}
                <figcaption class="mt-1.5 text-sm text-[#999] italic">{block.caption}</figcaption>
            {/if}
        </figure>
    {:else if block.type === 'btn'}
        {@const style = 'inline-block rounded-[5px] border-2 border-btn-line bg-btn px-6 py-3 text-center font-condensed text-base leading-[1.2] uppercase text-white shadow-btn hover:border-b-2 hover:border-btn-line-hover hover:bg-btn-hover active:translate-y-[2px] active:shadow-btn-active'}
        <p>
            {#if internal(block.href)}
                <a href={block.href.slice(1)} use:link class={style}>{block.label}</a>
            {:else if safe(block.href)}
                <a href={block.href} rel="noopener noreferrer" class={style}>{block.label}</a>
            {:else}
                <!-- Refused by the allowlist: the label survives, the link does not. -->
                <span class="{style} opacity-60">{block.label}</span>
            {/if}
        </p>
    {:else if block.type === 'hr'}
        <!-- `.news-article hr`: the repeating dotted SVG border-image, 8px tall — the same
             declaration `.static-content hr` uses, shared in styles.css. -->
        <hr class="article-rule" />
    {/if}
{/each}
