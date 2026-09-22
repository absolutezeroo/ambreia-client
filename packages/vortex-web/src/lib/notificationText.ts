import {t} from './i18n.js';
import {NOTIFICATION, notificationData, type INotification} from './notifications.js';

/**
 * Turning one notification into one sentence.
 *
 * Separate from the component that draws it because there are thirty of these and the layout is
 * four lines: mixed together, the wording would be the component.
 */

/** Where a notification leads when it leads anywhere. Null leaves the row unclickable. */
export function notificationHref(notification: INotification): string | null
{
    const {kind, targetId, actor} = notification;

    if(kind === NOTIFICATION.FEED_MENTIONED
        || kind === NOTIFICATION.FEED_COMMENTED
        || kind === NOTIFICATION.FEED_REPOSTED
        || kind === NOTIFICATION.FEED_FAVOURITED)
    {
        // The feed has no per-post page, so the thread opens in the feed itself. `targetId` is the
        // post that was answered, not the answer — that is the thread worth opening.
        return targetId ? '/community/chats' : null;
    }

    if(kind === NOTIFICATION.ROOM_RATED
        || kind === NOTIFICATION.ROOM_MODERATED
        || kind === NOTIFICATION.ROOM_RIGHTS_GRANTED
        || kind === NOTIFICATION.ROOM_RAID_DETECTED
        || kind === NOTIFICATION.RENTAL_EXPIRED)
    {
        return targetId ? `/room/${targetId}` : null;
    }

    if(kind === NOTIFICATION.BLOCKED
        || kind === NOTIFICATION.FRIEND_REQUEST_RECEIVED
        || kind === NOTIFICATION.FRIEND_REQUEST_ACCEPTED
        || kind === NOTIFICATION.RESPECT_RECEIVED)
    {
        return actor ? `/profile/${encodeURIComponent(actor.name)}` : null;
    }

    if(kind === NOTIFICATION.CLUB_EXPIRED || kind === NOTIFICATION.CLUB_GIFT_TOKEN)
    {
        return '/shop';
    }

    if(kind === NOTIFICATION.PASSWORD_CHANGED
        || kind === NOTIFICATION.MFA_CHANGED
        || kind === NOTIFICATION.NAME_CHANGED)
    {
        return '/settings/security';
    }

    return null;
}

/**
 * The sentence, already translated.
 *
 * One key per kind, and the payload supplies whatever numbers or names it carries. A kind with no
 * key of its own falls back to a generic line rather than rendering the raw key — an unread
 * counter that cannot be cleared because one row throws is worse than one vague sentence.
 */
export function notificationText(notification: INotification): string
{
    const data = notificationData(notification);
    const who = notification.actor?.name ?? '';
    const key = KEYS[notification.kind];

    if(!key)
    {
        return t('SITE_NOTIF_UNKNOWN');
    }

    // Every parameter every line could want, handed over together. `t` only substitutes the ones
    // its own string names, so a spare costs nothing and a missing one is the bug worth avoiding.
    return t(key, {
        name: who,
        count: String(data.credits ?? data.tokens ?? data.amount ?? data.points ?? data.arrivals ?? ''),
        value: String(data.name ?? data.badge ?? data.code ?? data.collection ?? data.track ?? data.from ?? ''),
        level: String(data.level ?? ''),
        price: String(data.price ?? ''),
        serial: String(data.serial ?? ''),
        seconds: String(data.seconds ?? ''),
    });
}

/**
 * Kind to translation key.
 *
 * A plain lookup rather than a switch so an unknown kind is `undefined` and takes the fallback —
 * the emulator can ship a new kind before the site knows about it, and the list still renders.
 */
const KEYS: Record<number, string> = {
    [NOTIFICATION.CLUB_EXPIRED]: 'SITE_NOTIF_CLUB_EXPIRED',
    [NOTIFICATION.CLUB_PAYDAY]: 'SITE_NOTIF_CLUB_PAYDAY',
    [NOTIFICATION.CLUB_GIFT_TOKEN]: 'SITE_NOTIF_CLUB_GIFT_TOKEN',
    [NOTIFICATION.REWARD_TRACK_COMPLETED]: 'SITE_NOTIF_REWARD_TRACK',
    [NOTIFICATION.RAFFLE_WON]: 'SITE_NOTIF_RAFFLE_WON',
    [NOTIFICATION.VOUCHER_REDEEMED]: 'SITE_NOTIF_VOUCHER',

    [NOTIFICATION.BLOCKED]: 'SITE_NOTIF_BLOCKED',
    [NOTIFICATION.FRIEND_REQUEST_RECEIVED]: 'SITE_NOTIF_FRIEND_REQUEST',
    [NOTIFICATION.FRIEND_REQUEST_ACCEPTED]: 'SITE_NOTIF_FRIEND_ACCEPTED',
    [NOTIFICATION.RESPECT_RECEIVED]: 'SITE_NOTIF_RESPECT',
    [NOTIFICATION.GROUP_MEMBERSHIP_ACCEPTED]: 'SITE_NOTIF_GROUP_ACCEPTED',
    [NOTIFICATION.GROUP_MEMBERSHIP_REJECTED]: 'SITE_NOTIF_GROUP_REJECTED',
    [NOTIFICATION.GROUP_KICKED]: 'SITE_NOTIF_GROUP_KICKED',
    [NOTIFICATION.GROUP_JOIN_REQUESTED]: 'SITE_NOTIF_GROUP_JOIN_REQUESTED',

    [NOTIFICATION.MUTED]: 'SITE_NOTIF_MUTED',
    [NOTIFICATION.TRADING_LOCKED]: 'SITE_NOTIF_TRADING_LOCKED',
    [NOTIFICATION.CFH_CLOSED]: 'SITE_NOTIF_CFH_CLOSED',
    [NOTIFICATION.ROOM_MODERATED]: 'SITE_NOTIF_ROOM_MODERATED',

    [NOTIFICATION.MARKETPLACE_SOLD]: 'SITE_NOTIF_MARKETPLACE_SOLD',
    [NOTIFICATION.GIFT_RECEIVED]: 'SITE_NOTIF_GIFT',
    [NOTIFICATION.RENTAL_EXPIRED]: 'SITE_NOTIF_RENTAL_EXPIRED',

    [NOTIFICATION.ACHIEVEMENT_LEVEL_UP]: 'SITE_NOTIF_ACHIEVEMENT',
    [NOTIFICATION.QUEST_COMPLETED]: 'SITE_NOTIF_QUEST',
    [NOTIFICATION.BADGE_GRANTED]: 'SITE_NOTIF_BADGE',
    [NOTIFICATION.HABBICON_COLLECTION_COMPLETED]: 'SITE_NOTIF_HABBICON_COLLECTION',
    [NOTIFICATION.PRIZE_AWARDED]: 'SITE_NOTIF_PRIZE',

    [NOTIFICATION.FEED_MENTIONED]: 'SITE_NOTIF_FEED_MENTIONED',
    [NOTIFICATION.FEED_COMMENTED]: 'SITE_NOTIF_FEED_COMMENTED',
    [NOTIFICATION.FEED_REPOSTED]: 'SITE_NOTIF_FEED_REPOSTED',
    [NOTIFICATION.FEED_FAVOURITED]: 'SITE_NOTIF_FEED_FAVOURITED',

    [NOTIFICATION.PASSWORD_CHANGED]: 'SITE_NOTIF_PASSWORD',
    [NOTIFICATION.MFA_CHANGED]: 'SITE_NOTIF_MFA',
    [NOTIFICATION.NAME_CHANGED]: 'SITE_NOTIF_NAME',

    [NOTIFICATION.ROOM_RATED]: 'SITE_NOTIF_ROOM_RATED',
    [NOTIFICATION.ROOM_RIGHTS_GRANTED]: 'SITE_NOTIF_ROOM_RIGHTS',
    [NOTIFICATION.ROOM_RAID_DETECTED]: 'SITE_NOTIF_ROOM_RAID',
};
