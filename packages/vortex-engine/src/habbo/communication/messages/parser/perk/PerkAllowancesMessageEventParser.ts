import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import {PerkAllowanceData} from './PerkAllowanceData';

/**
 * Parser for perk allowance data.
 *
 * @see sources/win63_version/habbo/communication/messages/parser/perk/PerkAllowancesMessageEventParser.as
 */
export class PerkAllowancesMessageEventParser implements IMessageParser
{
    private _perks: PerkAllowanceData[] = [];

    // AS3: sources/win63_version/habbo/communication/messages/parser/perk/PerkAllowancesMessageEventParser.as::flush()
    flush(): boolean
    {
        this._perks.length = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/perk/PerkAllowancesMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper)
        {
            return false;
        }

        this._perks.length = 0;

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const perk = new PerkAllowanceData();
            perk.code = wrapper.readString();
            perk.errorMessage = wrapper.readString();
            perk.isAllowed = wrapper.readBoolean();
            this._perks.push(perk);
        }

        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/perk/PerkAllowancesMessageEventParser.as::getPerks()
    getPerks(): PerkAllowanceData[]
    {
        return this._perks;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/perk/PerkAllowancesMessageEventParser.as::isPerkAllowed()
    isPerkAllowed(code: string): boolean
    {
        const perk = this.getPerk(code);

        return perk !== null && perk.isAllowed;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/perk/PerkAllowancesMessageEventParser.as::getPerk()
    getPerk(code: string): PerkAllowanceData | null
    {
        for(const perk of this._perks)
        {
            if(perk.code === code)
            {
                return perk;
            }
        }

        return null;
    }
}
