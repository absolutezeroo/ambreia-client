import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * One configured skill of a rentable bot: the skill id and whatever that skill stores.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2401/_SafeCls_4258.as
 * (obfuscated in every tree; identified by its two getters `id`/`data` and by
 * `RentableBotMenuView.updateButtons()`, which reads both off `botSkillsWithCommands`).
 *
 * `data` is skill-specific: the in-client link skill (7) stores `"<caption>,<link>"`, the NUX
 * proceed skill (8) `"<caption>,<index>"`, the navigator search skill (14) `"<caption>,<query>"`.
 */
export class BotSkillData
{
    // AS3: .../_SafeCls_4258.as::_SafeCls_4258() / ::parse()
    static parse(wrapper: IMessageDataWrapper): BotSkillData
    {
        const id = wrapper.readInt();
        const data = wrapper.readString();

        return new BotSkillData(id, data);
    }

    constructor(id: number, data: string)
    {
        this._id = id;
        this._data = data;
    }

    // AS3: .../_SafeCls_4258.as::_SafeStr_4872
    private _id: number;

    // AS3: .../_SafeCls_4258.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: .../_SafeCls_4258.as::_SafeStr_4556
    private _data: string;

    // AS3: .../_SafeCls_4258.as::get data()
    get data(): string
    {
        return this._data;
    }
}
