import {request} from './api.js';

/**
 * What the hotel has told this player.
 *
 * The producers are event handlers all over the emulator — a lapsed membership, a block, a sale,
 * a mention on the feed — and they all write one `web_notifications` row. This is the only way
 * the site reads them back.
 */

/**
 * Mirrors `NotificationKind` in the emulator, numbered identically. The numbers and not the names
 * are what travels, so a value here that disagrees with the C# enum mislabels every row of that
 * kind — silently, because a number always parses.
 *
 * Grouped by theme with gaps, as the C# side is, so a new kind slots in without renumbering.
 */
export const NOTIFICATION = {
    CLUB_EXPIRED: 0,
    CLUB_PAYDAY: 1,
    CLUB_GIFT_TOKEN: 2,
    REWARD_TRACK_COMPLETED: 3,
    RAFFLE_WON: 4,
    VOUCHER_REDEEMED: 5,

    BLOCKED: 10,
    FRIEND_REQUEST_RECEIVED: 11,
    FRIEND_REQUEST_ACCEPTED: 12,
    RESPECT_RECEIVED: 13,
    GROUP_MEMBERSHIP_ACCEPTED: 14,
    GROUP_MEMBERSHIP_REJECTED: 15,
    GROUP_KICKED: 16,
    GROUP_JOIN_REQUESTED: 17,

    MUTED: 20,
    TRADING_LOCKED: 21,
    CFH_CLOSED: 22,
    ROOM_MODERATED: 23,

    MARKETPLACE_SOLD: 30,
    GIFT_RECEIVED: 31,
    RENTAL_EXPIRED: 32,

    ACHIEVEMENT_LEVEL_UP: 40,
    QUEST_COMPLETED: 41,
    BADGE_GRANTED: 42,
    HABBICON_COLLECTION_COMPLETED: 43,
    PRIZE_AWARDED: 44,

    FEED_MENTIONED: 50,
    FEED_COMMENTED: 51,
    FEED_REPOSTED: 52,

    PASSWORD_CHANGED: 60,
    MFA_CHANGED: 61,
    NAME_CHANGED: 62,

    ROOM_RATED: 70,
    ROOM_RIGHTS_GRANTED: 71,
    ROOM_RAID_DETECTED: 72,
} as const;

/** Who caused it, when that is a player rather than the hotel itself. */
export interface INotificationActor
{
    id: number;
    name: string;
    figureString: string;
}

export interface INotification
{
    id: number;
    kind: number;
    createdAt: string;
    seen: boolean;
    actor: INotificationActor | null;

    /** What it points at, read together with `kind` — a post, a room, a group. */
    targetId: number | null;

    /**
     * The kind's own payload, as raw JSON or null. Parsed by the line that words it and nowhere
     * else: thirty kinds carry thirty shapes, and a single typed union would be thirty interfaces
     * of which each line uses one.
     */
    data: string | null;
}

export interface INotificationPage
{
    page: number;
    pageSize: number;
    total: number;
    unread: number;
    items: INotification[];
}

export function getNotifications(page = 1, pageSize = 0): Promise<INotificationPage>
{
    const query = new URLSearchParams();

    if(page > 1)
    {
        query.set('page', String(page));
    }

    if(pageSize > 0)
    {
        query.set('pageSize', String(pageSize));
    }

    const suffix = query.size ? `?${query}` : '';

    return request(`/api/user/notifications${suffix}`);
}

/**
 * Marks every unread notification read, and answers how many moved.
 *
 * All of them, not the ones on screen — the server decides that, and the counter is what the
 * player is clearing.
 */
export function markNotificationsRead(): Promise<{read: number}>
{
    return request('/api/user/notifications/read', {method: 'POST'});
}

/**
 * The payload, parsed, or an empty object.
 *
 * Never throws: `data` is written by whichever handler raised the line, and a line that cannot be
 * worded in full is still worth showing with its date and its author.
 */
export function notificationData(notification: INotification): Record<string, unknown>
{
    if(!notification.data)
    {
        return {};
    }

    try
    {
        return JSON.parse(notification.data) as Record<string, unknown>;
    }
    catch
    {
        return {};
    }
}
