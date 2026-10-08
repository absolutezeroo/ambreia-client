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

    // AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2646.as::flush()
    flush(): boolean
    {
        this._id = 0;
        this._figure = '';
        this._sex = '';
        this._customInfo = '';
        this._achievementScore = 0;
        return true;
    }

    // AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2646.as::parse()
    // DEVIATION: AS3 reads three more fields after achievementScore (an unused string, a list of
    // unused int triplets, badgesRank). The RPG server (UserChangeMessageComposerSerializer) ends
    // the message at the score, so this stops there too.
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

        if(this._sex)
        {
            this._sex = this._sex.toUpperCase();
        }

        return true;
    }
}
