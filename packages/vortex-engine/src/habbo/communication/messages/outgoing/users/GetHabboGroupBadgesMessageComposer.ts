import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * GetHabboGroupBadgesMessageComposer (header 3346)
 *
 * Empty request, sent once per room entry by `HabboGroupInfoManager`: the reply
 * (`HabboGroupBadgesMessageEvent`, 1400) carries the badge code of every group with a
 * presence in the room, which is what lets `BadgeImageWidget` draw a group badge from a
 * bare group id.
 *
 * Class name recovered from
 * sources/win63_version/habbo/communication/messages/outgoing/users/GetHabboGroupBadgesMessageComposer.as
 * — but the header there is that older build's 2767 and does **not** apply. 3346 comes
 * from WIN63's own registry (`habbo/communication/_SafeCls_2046.as:957`, `_SafeCls_2839`)
 * and is corroborated by vortex-emulator's `GetHabboGroupBadgesMessageEvent = 3346`. The
 * 2317 this file used to claim matches neither tree.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1789/_SafeCls_2839.as
 */
export class GetHabboGroupBadgesMessageComposer extends MessageComposer<[]>
{
    private _data: [] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1789/_SafeCls_2839.as::getMessageArray()
    getMessageArray(): []
    {
        return this._data;
    }
}
