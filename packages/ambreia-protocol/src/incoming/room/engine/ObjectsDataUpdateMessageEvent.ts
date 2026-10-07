/**
 * ObjectsDataUpdateMessageEvent — incoming batch furni state/stuff-data update (header 632).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_3490.as
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    ObjectsDataUpdateMessageParser
} from '../../../parser/room/engine/ObjectsDataUpdateMessageParser';

export class ObjectsDataUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ObjectsDataUpdateMessageParser);
    }
}
