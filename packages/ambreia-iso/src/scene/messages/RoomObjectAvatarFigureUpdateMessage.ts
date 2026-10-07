/**
 * RoomObjectAvatarFigureUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarFigureUpdateMessage
 *
 * Update message for avatar figure (look) and gender.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarFigureUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(figure: string, gender: string, race: string = '', isRiding: boolean = false)
    {
        super(null, null);
        this._figure = figure;
        this._gender = gender;
        this._race = race;
        this._isRiding = isRiding;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarFigureUpdateMessage.as::_figure
    private _figure: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarFigureUpdateMessage.as::get figure()
    get figure(): string
    {
        return this._figure;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarFigureUpdateMessage.as::_gender
    private _gender: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarFigureUpdateMessage.as::get gender()
    get gender(): string
    {
        return this._gender;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarFigureUpdateMessage.as::_race
    private _race: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarFigureUpdateMessage.as::get race()
    get race(): string
    {
        return this._race;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarFigureUpdateMessage.as::_isRiding
    private _isRiding: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarFigureUpdateMessage.as::get isRiding()
    get isRiding(): boolean
    {
        return this._isRiding;
    }
}
