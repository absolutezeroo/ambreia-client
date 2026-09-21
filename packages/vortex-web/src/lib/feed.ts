// The social feed's half of the API — see
// ../../../vortex-emulator/Vortex.WebApi/Hosting/WebApiEndpoints.Feed.cs, which is the contract
// this file mirrors. Split out of `api.ts` rather than added to it because that file is already
// 788 lines and every screen imports it; nothing outside the feed needs these calls.
//
// The payload types are not written here either: they come from `api.generated.ts`, produced from
// the API's own OpenAPI document by `pnpm api:types`.
import type {components} from './api.generated';
import {request} from './api.js';

type Schemas = components['schemas'];

export type IFeedPost = Schemas['FeedPost'];
export type IFeedPage = Schemas['FeedPage'];
export type IFeedPoll = Schemas['FeedPoll'];
export type IFeedPollChoice = Schemas['FeedPollChoice'];

// The kinds come across as their numbers, which is what the wire carries — see
// Vortex.Primitives/Feed/FeedPostKind.cs, where they are decided. Naming them here keeps
// `kind === 1` out of the components.
export const FEED_KIND = {
    STATUS: 0,
    PHOTO: 1,
    POLL: 2,
} as const;

/** The feed, newest first. `tag` filters to one hashtag; it may be written with or without its `#`. */
export function getFeed(options: {page?: number; pageSize?: number; tag?: string} = {}): Promise<IFeedPage>
{
    const query = new URLSearchParams();

    if(options.page)
    {
        query.set('page', String(options.page));
    }

    if(options.pageSize)
    {
        query.set('pageSize', String(options.pageSize));
    }

    if(options.tag)
    {
        query.set('tag', options.tag);
    }

    return request(`/api/public/feed${query.size ? `?${query}` : ''}`);
}

/** One post and all of its comments. Throws `feed_post_not_found` for an id that is not readable. */
export function getPost(id: number): Promise<IFeedPost>
{
    return request(`/api/public/feed/${id}`);
}
