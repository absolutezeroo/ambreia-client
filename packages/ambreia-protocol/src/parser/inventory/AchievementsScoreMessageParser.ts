import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for achievements score message
 *
 * @see source_as_win63/habbo/communication/messages/parser/inventory/achievements/AchievementsScoreEventParser.as
 */
export class AchievementsScoreMessageParser implements IMessageParser
{
    private _score: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/inventory/achievements/AchievementsScoreEventParser.as::get score()
    get score(): number
    {
        return this._score;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/inventory/achievements/AchievementsScoreEventParser.as::flush()
    flush(): boolean
    {
        this._score = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/inventory/achievements/AchievementsScoreEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._score = wrapper.readInt();
        return true;
    }
}
