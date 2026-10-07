import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session pet commands update event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionPetCommandsUpdateEvent.as
 */
export class RoomSessionPetCommandsUpdateEvent extends RoomSessionEvent
{
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetCommandsUpdateEvent.as::PET_COMMANDS
    public static readonly PET_COMMANDS = 'RSPIUE_ENABLED_PET_COMMANDS';

    constructor(session: IRoomSession, petId: number, allCommands: number[], enabledCommands: number[])
    {
        super(RoomSessionPetCommandsUpdateEvent.PET_COMMANDS, session);
        this._petId = petId;
        this._allCommands = allCommands;
        this._enabledCommands = enabledCommands;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPetCommandsUpdateEvent.as::_petId
    private _petId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetCommandsUpdateEvent.as::get petId()
    get petId(): number
    {
        return this._petId;
    }

    private _allCommands: number[];

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetCommandsUpdateEvent.as::get allCommands()
    get allCommands(): number[]
    {
        return this._allCommands;
    }

    private _enabledCommands: number[];

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetCommandsUpdateEvent.as::get enabledCommands()
    get enabledCommands(): number[]
    {
        return this._enabledCommands;
    }
}
