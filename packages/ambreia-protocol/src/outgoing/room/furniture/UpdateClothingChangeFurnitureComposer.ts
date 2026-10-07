import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Update clothing change furniture with gender and figure data
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/room/engine/SetClothingChangeDataMessageComposer.as
 */
export class UpdateClothingChangeFurnitureComposer extends MessageComposer<ConstructorParameters<typeof UpdateClothingChangeFurnitureComposer>>
{
    private _data: ConstructorParameters<typeof UpdateClothingChangeFurnitureComposer>;

    constructor(objectId: number, gender: string, figure: string)
    {
        super();
        this._data = [objectId, gender, figure];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/engine/SetClothingChangeDataMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
