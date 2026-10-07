/**
 * UserChangeMessageEventParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.UserChangeMessageEventParser
 *
 * Parses user figure/info changes (different from UserUpdateMessageParser which handles position)
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class UserChangeMessageEventParser implements IMessageParser
{
    private _id: number = 0;

    // AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2646.as::get id()
    get id(): number
    {
        return this._id;
    }

    private _figure: string = '';

    // AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2646.as::get figure()
    get figure(): string
    {
        return this._figure;
    }

    private _sex: string = '';

    // AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2646.as::get sex()
    get sex(): string
    {
        return this._sex;
    }

    // AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2646.as::_customInfo
    private _customInfo: string = '';

    // AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2646.as::get customInfo()
    get customInfo(): string
    {
        return this._customInfo;
    }

    // AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2646.as::_achievementScore
    private _achievementScore: number = 0;

    // AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2646.as::get achievementScore()
    get achievementScore(): number
    {
        return this._achievementScore;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2646.as::badgesRank
    private _badgesRank: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2646.as::get badgesRank()
    get badgesRank(): number
    {
        return this._badgesRank;
    }

    // AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2646.as::flush()
    flush(): boolean
    {
        this._id = 0;
        this._figure = '';
        this._sex = '';
        this._customInfo = '';
        this._achievementScore = 0;
        this._badgesRank = 0;
        return true;
    }

    /**
     * AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2646.as::parse()
     *
     * The read order below is AS3's, field for field: id, figure, sex, customInfo,
     * achievementScore, an unused string, a count-prefixed list of unused int triplets, then
     * badgesRank. **Do not make the tail conditional** — the last four are load-bearing framing
     * even though three of their values are discarded.
     *
     * Header 3798. The server used to write only the first five, so the sixth read threw
     * `End of buffer` and the message was dropped whole; a figure or motto change made outside the
     * room never landed. Diagnosed and completed server-side on 2026-08-08
     * (`Revision20260701/Serializers/.../UserChangeMessageComposerSerializer.cs`), which now writes
     * all nine.
     */
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._id = wrapper.readInt();
        this._figure = wrapper.readString();
        this._sex = wrapper.readString();
        this._customInfo = wrapper.readString();
        this._achievementScore = wrapper.readInt();
        // AS3 reads an unused string here, then a count-prefixed list of unused
        // int triplets (_SafePkg_2184/_SafeCls_2646.as::parse()) before badgesRank.
        wrapper.readString();

        const skippedCount = wrapper.readInt();

        for(let i = 0; i < skippedCount; i++)
        {
            wrapper.readInt();
            wrapper.readInt();
            wrapper.readInt();
        }

        this._badgesRank = wrapper.readInt();

        if(this._sex)
        {
            this._sex = this._sex.toUpperCase();
        }

        return true;
    }
}
