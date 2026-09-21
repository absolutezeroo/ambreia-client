<script lang="ts">
    // The screenshot's poll: one radio per choice, a bar filled to its share, and the percentage
    // to the right of it.
    //
    // The server sends COUNTS and the percentage is computed here, because a percentage is a
    // rendering decision — it rounds, and the rounded values need not sum to 100 — where a count
    // is a fact. Keeping the arithmetic on this side also means the bar and the number can never
    // disagree with each other.
    import {vote, type IFeedPost} from '../../lib/feed.js';
    import {signedIn} from '../../lib/session.js';
    import * as notifier from '../../lib/notifier.js';

    let {post, onvoted}: {post: IFeedPost; onvoted: (updated: IFeedPost) => void} = $props();

    let busy = $state(false);

    function share(votes: number): number
    {
        // Guarded on the TOTAL, not on the choice's own count: dividing by zero is how every bar
        // on a poll nobody has answered yet ends up `NaN%` wide.
        return post.poll?.totalVotes ? Math.round((votes / post.poll.totalVotes) * 100) : 0;
    }

    async function choose(choiceId: number)
    {
        // Re-voting the same choice is allowed and is a no-op server-side, so it is not guarded
        // here — a player who clicks their own answer again should not be told anything.
        if(busy || !$signedIn)
        {
            return;
        }

        busy = true;

        try
        {
            onvoted(await vote(post.id, choiceId));
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

{#if post.poll}
    <ul class="mb-3 flex flex-col gap-1 rounded-[3px] bg-box p-3">
        {#each post.poll.choices as choice (choice.id)}
            <li class="flex items-center gap-2">
                <button
                    type="button"
                    onclick={() => choose(choice.id)}
                    disabled={busy || !$signedIn}
                    class="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
                >
                    <span
                        class="size-3 shrink-0 rounded-full border-2 border-white {post.poll.myChoiceId === choice.id ? 'bg-white' : ''}"
                    ></span>
                    <span class="truncate">{choice.label}</span>
                </button>

                <span class="h-4 w-40 shrink-0 bg-field/30">
                    <span class="block h-full bg-field" style="width: {share(choice.votes)}%"></span>
                </span>

                <span class="w-10 shrink-0 text-right text-sm">{share(choice.votes)}%</span>
            </li>
        {/each}
    </ul>
{/if}
