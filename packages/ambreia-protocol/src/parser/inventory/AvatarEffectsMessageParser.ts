import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Avatar effect data
 */
export interface IAvatarEffect
{
    type: number;
    subType: number;
    duration: number;
    inactiveEffectsInInventory: number;
    secondsLeftIfActive: number;
    isPermanent: boolean;
}

/**
 * Parser for avatar effects message
 *
 * @see source_as_win63/habbo/communication/messages/parser/inventory/avatareffect/AvatarEffectsMessageEventParser.as
 */
export class AvatarEffectsMessageParser implements IMessageParser
{
    private _effects: IAvatarEffect[] = [];

    // AS3: sources/win63_version/habbo/communication/messages/parser/inventory/avatareffect/AvatarEffectsMessageEventParser.as::get effects()
    get effects(): IAvatarEffect[]
    {
        return this._effects;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/inventory/avatareffect/AvatarEffectsMessageEventParser.as::flush()
    flush(): boolean
    {
        this._effects = [];
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/inventory/avatareffect/AvatarEffectsMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            const effect: IAvatarEffect = {
                type: wrapper.readInt(),
                subType: wrapper.readInt(),
                duration: wrapper.readInt(),
                inactiveEffectsInInventory: wrapper.readInt(),
                secondsLeftIfActive: wrapper.readInt(),
                isPermanent: wrapper.readBoolean(),
            };
            this._effects.push(effect);
        }
        return true;
    }
}
