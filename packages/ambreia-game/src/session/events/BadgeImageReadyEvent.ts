/**
 * Badge image ready event
 *
 * @see source_as_win63/habbo/session/events/BadgeImageReadyEvent.as
 */
export class BadgeImageReadyEvent
{
    public static readonly BADGE_IMAGE_READY = 'BIRE_BADGE_IMAGE_READY';

    constructor(badgeId: string, badgeImage: unknown = null)
    {
        this._badgeId = badgeId;
        this._badgeImage = badgeImage;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/BadgeImageReadyEvent.as::_badgeId
    private _badgeId: string;

    // AS3: .../src/com/sulake/habbo/session/events/BadgeImageReadyEvent.as::get badgeId()
    get badgeId(): string
    {
        return this._badgeId;
    }

    private _badgeImage: unknown;

    // AS3: .../src/com/sulake/habbo/session/events/BadgeImageReadyEvent.as::get badgeImage()
    get badgeImage(): unknown
    {
        return this._badgeImage;
    }
}
