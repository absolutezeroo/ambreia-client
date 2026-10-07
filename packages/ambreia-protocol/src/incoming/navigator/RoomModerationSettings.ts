import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Moderation rights levels
 */
export const RoomModerationRights = {
    NONE: 0,
    RIGHTS: 1,
    RIGHTS_WITH_CONTROLLER: 2,
    GROUP_ADMINS: 4,
    OWNER_ONLY: 5,
} as const;

/**
 * Room moderation settings
 *
 * Based on AS3 com.sulake.habbo.communication.messages.incoming.roomsettings.class_1731
 */
export class RoomModerationSettings
{
    constructor(wrapper: IMessageDataWrapper)
    {
        this._whoCanMute = wrapper.readInt();
        this._whoCanKick = wrapper.readInt();
        this._whoCanBan = wrapper.readInt();
    }

    private _whoCanMute: number = 0;

    get whoCanMute(): number
    {
        return this._whoCanMute;
    }

    private _whoCanKick: number = 0;

    get whoCanKick(): number
    {
        return this._whoCanKick;
    }

    private _whoCanBan: number = 0;

    get whoCanBan(): number
    {
        return this._whoCanBan;
    }
}
