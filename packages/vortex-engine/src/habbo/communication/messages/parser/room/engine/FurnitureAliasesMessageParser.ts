/**
 * FurnitureAliasesMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.FurnitureAliasesMessageEventParser
 *
 * Parser for furniture type aliases. Maps furniture type names to their aliases.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class FurnitureAliasesMessageParser implements IMessageParser
{
    private _names: string[] = [];
    private _aliases: string[] = [];

    get aliasCount(): number
    {
        return this._names.length;
    }

    getName(index: number): string | null
    {
        if(index < 0 || index >= this._names.length)
        {
            return null;
        }

        return this._names[index];
    }

    getAlias(index: number): string | null
    {
        if(index < 0 || index >= this._aliases.length)
        {
            return null;
        }

        return this._aliases[index];
    }

    flush(): boolean
    {
        this._names = [];
        this._aliases = [];
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._names = [];
        this._aliases = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const name = wrapper.readString();
            const alias = wrapper.readString();

            this._names.push(name);
            this._aliases.push(alias);
        }

        return true;
    }
}
