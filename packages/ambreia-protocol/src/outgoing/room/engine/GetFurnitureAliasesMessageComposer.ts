import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * GetFurnitureAliasesMessageComposer
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.engine.GetFurnitureAliasesMessageComposer
 *
 * Requests furniture aliases from the server.
 * Sent on first room entry.
 */
export class GetFurnitureAliasesMessageComposer extends MessageComposer<[]>
{
    private _data: [] = [];

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/engine/GetFurnitureAliasesMessageComposer.as::getMessageArray()
    getMessageArray(): []
    {
        return this._data;
    }
}
