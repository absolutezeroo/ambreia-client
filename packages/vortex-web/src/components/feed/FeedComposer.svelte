<script lang="ts">
    // The composer, and the comment form: the screenshot shows the same control in both places,
    // with the same three tabs, so it is one component with a `parentId`.
    //
    // The photo and poll tabs arrive in Tasks 6 and 7; the tab strip is here from the start
    // because it is what tells a reader the other two are coming, and because moving a working
    // form into a tab later is how a working form stops working.
    import Panel from '../Panel.svelte';
    import Avatar from '../Avatar.svelte';
    import Button from '../Button.svelte';
    import {publish, FEED_KIND, type IFeedPost} from '../../lib/feed.js';
    import * as notifier from '../../lib/notifier.js';
    import {t} from '../../lib/i18n.js';
    import {me} from '../../lib/session.js';

    let {parentId = undefined, onpublished}: {parentId?: number; onpublished: (post: IFeedPost) => void} =
        $props();

    let body = $state('');
    let busy = $state(false);

    async function submit()
    {
        if(busy || !body.trim())
        {
            return;
        }

        busy = true;

        try
        {
            onpublished(await publish({kind: FEED_KIND.STATUS, body, parentId}));
            body = '';
        }
        catch(failure)
        {
            notifier.error((failure as Error).message);
        }
        finally
        {
            busy = false;
        }
    }
</script>

<Panel title={t(parentId ? 'SITE_FEED_WRITE_AS' : 'SITE_FEED_POST_AS')}>
    <div class="flex gap-3">
        <Avatar user={$me?.name ?? ''} figure={$me?.figureString ?? ''} headOnly className="hidden shrink-0 xs:block" />

        <div class="min-w-0 flex-1">
            <textarea
                bind:value={body}
                maxlength="500"
                rows="3"
                placeholder={t(parentId ? 'SITE_FEED_COMMENT_PLACEHOLDER' : 'SITE_FEED_POST_PLACEHOLDER')}
                class="w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-base leading-[1.2] text-field-ink shadow-field placeholder:text-[#888] focus:border-field-line-focus focus:bg-white focus:outline-none"
            ></textarea>

            <div class="mt-2 flex justify-end">
                <Button onclick={submit} disabled={busy || !body.trim()}>
                    {t(parentId ? 'SITE_FEED_PUBLISH_COMMENT' : 'SITE_FEED_PUBLISH')}
                </Button>
            </div>
        </div>
    </div>
</Panel>
