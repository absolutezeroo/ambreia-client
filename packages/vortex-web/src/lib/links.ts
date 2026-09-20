// One document-level click handler, and it exists for the HTML this site does not write.
//
// `use:link` is how a route link is normally declared, and it needs a Svelte template to be applied
// in. Two kinds of markup here have none: habbo.com's mirrored CMS fragments, injected verbatim by
// `components/WebPage.svelte` with `{@html}`, and an article's own `btn` blocks, whose href comes
// out of the database. Both carry plain `<a href="/playing-habbo/help">`.
//
// Under the hash router those anchors navigated by changing the fragment, so the page never
// reloaded. On the History API they are ordinary links: letting one through means a full document
// load, which — since `App.svelte` mounts the game client ONCE, outside the router, so it survives
// every navigation — would tear down an open hotel session to show a help page. Hence the
// delegator: same-origin, unmodified left clicks are handed to the router instead.
import {push} from 'svelte-spa-router';

// `#/foo` is still what the mirrored fragments and older stored article hrefs say. The router's own
// `push` accepts either form; this only has to recognise it as ours.
function routeOf(anchor: HTMLAnchorElement): string | null
{
    const href = anchor.getAttribute('href') ?? '';

    if(href.startsWith('#/'))
    {
        return href.substring(1);
    }

    // Resolved against the document, so `/x`, `x` and a full URL on this origin all answer here,
    // while another host, `mailto:` or `javascript:` do not.
    if(anchor.origin !== window.location.origin || !anchor.pathname.startsWith('/'))
    {
        return null;
    }

    return anchor.pathname + anchor.search;
}

export function interceptLinks(): void
{
    document.addEventListener('click', (event) =>
    {
        // `use:link` runs its own listener ON the anchor, so it has already preventDefault()ed by
        // the time this bubbles up. Without this check the same click would be routed twice.
        if(event.defaultPrevented || event.button !== 0)
        {
            return;
        }

        // Ctrl/Cmd/Shift/Alt are the browser's own gestures — new tab, new window, download. A
        // router that swallowed them would make this site the one place where they do nothing.
        if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
        {
            return;
        }

        const anchor = (event.target as Element | null)?.closest?.('a');

        if(!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self'))
        {
            return;
        }

        const route = routeOf(anchor as HTMLAnchorElement);

        if(!route)
        {
            return;
        }

        event.preventDefault();
        void push(route);
    });
}
