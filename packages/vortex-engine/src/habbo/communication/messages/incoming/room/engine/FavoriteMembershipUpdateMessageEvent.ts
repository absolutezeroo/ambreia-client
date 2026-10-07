import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    FavoriteMembershipUpdateMessageEventParser
} from '../../../parser/room/engine/FavoriteMembershipUpdateMessageEventParser';

/**
 * A room occupant's favourite group changed - the badge shown beside their name in the infostand.
 *
 * Header 1259, from WIN63's own registry (`habbo/communication/_SafeCls_2046.as:1215`, where the
 * class is `_SafeCls_3475`) and corroborated by the emulator, which implements the composer.
 *
 * `win63_version` is cited only for the readable class name: this message is obfuscated in the
 * primary tree, which is where every member trace below points, because that tree is the
 * authority on behaviour and this one has shipped two bad decompiles today alone.
 *
 * @see sources/win63_version/habbo/communication/messages/incoming/room/engine/FavoriteMembershipUpdateMessageEvent.as
 */
export class FavoriteMembershipUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, FavoriteMembershipUpdateMessageEventParser);
    }
}
