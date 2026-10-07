import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Visit user (go to user's room)
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/friendlist/VisitUserMessageComposer.as
 */
export class VisitUserMessageComposer extends MessageComposer<ConstructorParameters<typeof VisitUserMessageComposer>>
{
    private _data: ConstructorParameters<typeof VisitUserMessageComposer>;

    constructor(userName: string)
    {
        super();
        this._data = [userName];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/friendlist/VisitUserMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
