import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import {BotSkillData} from './BotSkillData';

/**
 * The full skill list of one rentable bot (header 1293) — what the bot's context menu builds its
 * buttons from.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2401/_SafeCls_3342.as
 * (obfuscated; `_SafeStr_4546[1293] = _SafeCls_2996` in the registry
 * sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as:1221).
 */
export class BotSkillListUpdateParser implements IMessageParser
{
    // AS3: .../_SafeCls_3342.as::_SafeStr_6226
    private _botId: number = -1;
    // AS3: .../_SafeCls_3342.as::_SafeStr_8700
    private _skillList: BotSkillData[] = [];

    // AS3: .../_SafeCls_3342.as::get botId()
    get botId(): number
    {
        return this._botId;
    }

    // AS3: .../_SafeCls_3342.as::get skillList()
    get skillList(): BotSkillData[]
    {
        return this._skillList;
    }

    // AS3: .../_SafeCls_3342.as::flush()
    flush(): boolean
    {
        this._botId = -1;
        this._skillList = [];

        return true;
    }

    // AS3: .../_SafeCls_3342.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        // AS3 does NOT clear `_skillList` here — only flush() does, and the framework calls it
        // before every parse, so the list is empty either way. Re-created here to keep the parser
        // correct on its own.
        this._skillList = [];
        this._botId = wrapper.readInt();

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._skillList.push(BotSkillData.parse(wrapper));
        }

        return true;
    }
}
