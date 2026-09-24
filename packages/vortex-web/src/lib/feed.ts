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
export type IFeedAlbum = Schemas['FeedAlbum'];
export type IAlbum = Schemas['Album'];

// The kinds come across as their numbers, which is what the wire carries — see
// Vortex.Primitives/Feed/FeedPostKind.cs, where they are decided. Naming them here keeps
// `kind === 1` out of the components.
export const FEED_KIND = {
    STATUS: 0,
    PHOTO: 1,
    POLL: 2,
    // Never sent by the composer: `createAlbum()` posts the card. The feed only reads it.
    ALBUM: 3,
} as const;

// Vortex.Primitives/Feed/FeedReactionKind.cs decides these numbers, the same way FeedPostKind
// decides the ones above. Named here so `kind === 1` never appears in a component.
export const FEED_REACTION = {
    REPOST: 0,
    FAVORITE: 1,
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

/** Publish a post, or a comment when `parentId` is set. */
export function publish(body: {
    kind: number;
    body: string;
    photoKeys?: string[];
    pollChoices?: string[];
    parentId?: number;
    groupId?: number;
}): Promise<IFeedPost>
{
    return request('/api/user/feed', {method: 'POST', body});
}

/**
 * Vote in a poll, or move an existing vote. Answers the post as it now stands, so the caller
 * replaces its copy rather than adjusting a count by hand — the server is the one that knows
 * whether this was a new voice or a moved one.
 */
export function vote(postId: number, choiceId: number): Promise<IFeedPost>
{
    return request(`/api/user/feed/${postId}/vote`, {method: 'POST', body: {choiceId}});
}

/**
 * Leave or withdraw a repost or a favourite, and answer the post as it now stands.
 *
 * Takes the wanted state, not a toggle: a request the network retries would otherwise land on the
 * opposite of what the reader pressed. `PUT` for the same reason — sending it twice leaves one row.
 */
export function setReaction(postId: number, kind: number, on: boolean): Promise<IFeedPost>
{
    return request(`/api/user/feed/${postId}/reaction`, {method: 'PUT', body: {kind, on}});
}

/**
 * Delete one of my own posts, and its comments with it.
 *
 * `remove`, not `delete`: the latter is a reserved word and cannot be an export name. The server
 * answers the same 404 for "no such post", "already gone" and "not yours", so a caller has one
 * thing to do with a failure — stop showing the card either way.
 *
 * An account with a second factor is refused with `pocket.auth.mfa_required` until `code` carries
 * one. It rides the query string rather than a body because a DELETE with a body is the kind of
 * request an intermediary is entitled to strip; a TOTP is good for one 30-second window and for
 * one use, so what an access log keeps of it is already spent.
 */
export function remove(postId: number, code?: string): Promise<unknown>
{
    const query = code ? `?code=${encodeURIComponent(code)}` : '';

    return request(`/api/user/feed/${postId}${query}`, {method: 'DELETE'});
}

// Albums — ../../../vortex-emulator/Vortex.WebApi/Hosting/WebApiEndpoints.Album.cs. Here rather than
// in a file of their own because an album IS a feed card: it has no delete of its own, and is
// deleted through `remove(album.feedPostId)` above.

/** One album and its photos. Throws `album_not_found` for an id that is not readable. */
export function getAlbum(id: number): Promise<IAlbum>
{
    return request(`/api/public/albums/${id}`);
}

/** One player's albums, newest first. */
export function getPlayerAlbums(uniqueId: string): Promise<IFeedAlbum[]>
{
    return request(`/api/public/users/${encodeURIComponent(uniqueId)}/albums`);
}

/** Create an album out of my own published photos; its card goes into the feed. */
export function createAlbum(body: {title: string; description: string; photoKeys: string[]}): Promise<IAlbum>
{
    return request('/api/user/albums', {method: 'POST', body});
}

export function editAlbum(id: number, body: {title: string; description: string}): Promise<IAlbum>
{
    return request(`/api/user/albums/${id}`, {method: 'PUT', body});
}

/** Add photos; a photo already in the album is skipped. Brings the card back to the top. */
export function addAlbumPhotos(id: number, photoKeys: string[]): Promise<IAlbum>
{
    return request(`/api/user/albums/${id}/photos`, {method: 'POST', body: {photoKeys}});
}

export function removeAlbumPhoto(id: number, photoKey: string): Promise<IAlbum>
{
    return request(`/api/user/albums/${id}/photos/${encodeURIComponent(photoKey)}`, {method: 'DELETE'});
}

/**
 * Listens for threads changing, live.
 *
 * `onChanged` is handed the id of the ROOT post that moved — a comment, a like, a share, a vote
 * or a delete anywhere in that thread all name the root, because a reader's feed is a list of
 * roots and the root is the card to refresh.
 *
 * The stream carries the ID and never the post. A post's `favoritedByMe`, `repostedByMe` and
 * `mine` are answers about the READER, so one pushed copy would be right for whoever caused the
 * change and wrong for everybody else watching. Each reader fetches that card for themselves.
 *
 * Anonymous, like the feed's other reads: a signed-out visitor watching the page sees it move
 * too. Returns the closer.
 */
export function listenToFeed(onChanged: (rootPostId: number) => void): () => void
{
    const source = new EventSource('/api/public/feed/stream');

    source.onmessage = (event) =>
    {
        // The opening frame is `ready`, which exists only so the connection has begun before
        // anything happens on a quiet hotel. Anything that is not a number is ignored the same
        // way — a proxy's keep-alive must not be read as a post id.
        const rootId = Number.parseInt(event.data, 10);

        if(Number.isFinite(rootId))
        {
            onChanged(rootId);
        }
    };

    // No `onerror`: EventSource retries on its own, and giving up is the one thing that would
    // make a hotel restart cost every open feed its live updates until a reload.
    return () => source.close();
}
