/**
 * RoomWidgetRentableBotSkillListUpdateEvent
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetRentableBotSkillListUpdateEvent.as
 *
 * Carries the bot's skills *with* their stored data, which is what the context menu needs to build
 * its in-client-link and NUX buttons — the plain id list on the info event cannot express them.
 */
import {RoomWidgetUpdateEvent} from './RoomWidgetUpdateEvent';
import type {BotSkillData} from '@ambreia/protocol/parser/room/bot/BotSkillData';

export class RoomWidgetRentableBotSkillListUpdateEvent extends RoomWidgetUpdateEvent
{
    // AS3: .../RoomWidgetRentableBotSkillListUpdateEvent.as::SKILL_LIST
    public static readonly SKILL_LIST: string = 'RWRBSLUE_SKILL_LIST';

    // AS3: .../RoomWidgetRentableBotSkillListUpdateEvent.as::_SafeStr_6226
    private _botId: number;
    // AS3: .../RoomWidgetRentableBotSkillListUpdateEvent.as::_SafeStr_6153
    private _botSkillsWithCommands: BotSkillData[];

    // AS3: .../RoomWidgetRentableBotSkillListUpdateEvent.as::RoomWidgetRentableBotSkillListUpdateEvent()
    constructor(botId: number, botSkillsWithCommands: BotSkillData[])
    {
        super(RoomWidgetRentableBotSkillListUpdateEvent.SKILL_LIST);
        this._botId = botId;
        this._botSkillsWithCommands = botSkillsWithCommands;
    }

    // AS3: .../RoomWidgetRentableBotSkillListUpdateEvent.as::get botId()
    public get botId(): number
    {
        return this._botId;
    }

    // AS3: .../RoomWidgetRentableBotSkillListUpdateEvent.as::get botSkillsWithCommands()
    public get botSkillsWithCommands(): BotSkillData[]
    {
        return this._botSkillsWithCommands;
    }
}
