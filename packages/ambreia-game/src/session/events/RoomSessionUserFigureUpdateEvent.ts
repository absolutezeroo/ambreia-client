import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session user figure update event
 *
 * Based on AS3: com.sulake.habbo.session.events.RoomSessionUserFigureUpdateEvent
 */
export class RoomSessionUserFigureUpdateEvent extends RoomSessionEvent
{
    /**
	 * The event type, whose string is AS3's own
	 *
	 * The value matters beyond this class: it is what listeners subscribe by, and the port had
	 * been using `RSUFE_FIGURE_UPDATE` on both sides — internally consistent, but nothing written
	 * against AS3's name would have matched it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionUserFigureUpdateEvent.as::USER_FIGURE
    public static readonly USER_FIGURE = 'RSUBE_FIGURE';

    constructor(
        session: IRoomSession,
        roomIndex: number,
        figure: string,
        sex: string,
        customInfo: string,
        achievementScore: number,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionUserFigureUpdateEvent.as::badgesRank
        badgesRank: number
    )
    {
        super(RoomSessionUserFigureUpdateEvent.USER_FIGURE, session);
        this._roomIndex = roomIndex;
        this._figure = figure;
        this._sex = sex;
        this._customInfo = customInfo;
        this._achievementScore = achievementScore;
        this._badgesRank = badgesRank;
    }

    private _roomIndex: number;

    /**
	 * AS3 calls this `userId`; it carries the *room index*, which is what every caller passes and
	 * what the user data manager is keyed by. Named for what it holds.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionUserFigureUpdateEvent.as::get userId()
    get roomIndex(): number
    {
        return this._roomIndex;
    }

    private _figure: string;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionUserFigureUpdateEvent.as::get figure()
    get figure(): string
    {
        return this._figure;
    }

    private _sex: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionUserFigureUpdateEvent.as::get gender()
    get sex(): string
    {
        return this._sex;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionUserFigureUpdateEvent.as::_customInfo
    private _customInfo: string;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionUserFigureUpdateEvent.as::get customInfo()
    get customInfo(): string
    {
        return this._customInfo;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionUserFigureUpdateEvent.as::_achievementScore
    private _achievementScore: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionUserFigureUpdateEvent.as::get achievementScore()
    get achievementScore(): number
    {
        return this._achievementScore;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionUserFigureUpdateEvent.as::badgesRank
    private _badgesRank: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionUserFigureUpdateEvent.as::get badgesRank()
    get badgesRank(): number
    {
        return this._badgesRank;
    }
}
