import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session pet figure update event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionPetFigureUpdateEvent.as
 */
export class RoomSessionPetFigureUpdateEvent extends RoomSessionEvent
{
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetFigureUpdateEvent.as::PET_FIGURE_UPDATE
    public static readonly PET_FIGURE_UPDATE = 'RSPFUE_PET_FIGURE_UPDATE';

    constructor(session: IRoomSession, petId: number, figure: string)
    {
        super(RoomSessionPetFigureUpdateEvent.PET_FIGURE_UPDATE, session);
        this._petId = petId;
        this._figure = figure;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPetFigureUpdateEvent.as::_petId
    private _petId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetFigureUpdateEvent.as::get petId()
    get petId(): number
    {
        return this._petId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPetFigureUpdateEvent.as::_figure
    private _figure: string;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetFigureUpdateEvent.as::get figure()
    get figure(): string
    {
        return this._figure;
    }
}
