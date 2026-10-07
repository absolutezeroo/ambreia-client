import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session error message event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionErrorMessageEvent.as
 */
export class RoomSessionErrorMessageEvent extends RoomSessionEvent
{
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::KICKED_BY_OWNER
    public static readonly KICKED_BY_OWNER = 'RSEME_KICKED';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::PETS_FORBIDDEN_IN_HOTEL
    public static readonly PETS_FORBIDDEN_IN_HOTEL = 'RSEME_PETS_FORBIDDEN_IN_HOTEL';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::PETS_FORBIDDEN_IN_FLAT
    public static readonly PETS_FORBIDDEN_IN_FLAT = 'RSEME_PETS_FORBIDDEN_IN_FLAT';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::MAX_NUMBER_OF_PETS
    public static readonly MAX_NUMBER_OF_PETS = 'RSEME_MAX_PETS';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::MAX_NUMBER_OF_OWN_PETS
    public static readonly MAX_NUMBER_OF_OWN_PETS = 'RSEME_MAX_NUMBER_OF_OWN_PETS';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::NO_FREE_TILES_FOR_PET
    public static readonly NO_FREE_TILES_FOR_PET = 'RSEME_NO_FREE_TILES_FOR_PET';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::SELECTED_TILE_NOT_FREE_FOR_PET
    public static readonly SELECTED_TILE_NOT_FREE_FOR_PET = 'RSEME_SELECTED_TILE_NOT_FREE_FOR_PET';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::BOTS_FORBIDDEN_IN_HOTEL
    public static readonly BOTS_FORBIDDEN_IN_HOTEL = 'RSEME_BOTS_FORBIDDEN_IN_HOTEL';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::BOTS_FORBIDDEN_IN_FLAT
    public static readonly BOTS_FORBIDDEN_IN_FLAT = 'RSEME_BOTS_FORBIDDEN_IN_FLAT';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::BOT_LIMIT_REACHED
    public static readonly BOT_LIMIT_REACHED = 'RSEME_BOT_LIMIT_REACHED';
    public static readonly SELECTED_TILE_NOT_FREE_FOR_BOT = 'RSEME_SELECTED_TILE_NOT_FREE_FOR_BOT';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::BOT_NAME_NOT_ACCEPTED
    public static readonly BOT_NAME_NOT_ACCEPTED = 'RSEME_BOT_NAME_NOT_ACCEPTED';

    constructor(type: string, session: IRoomSession, message: string | null = null, openLandingPage: boolean = false)
    {
        super(type, session, openLandingPage);
        this._message = message;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::_message
    private _message: string | null;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionErrorMessageEvent.as::get message()
    get message(): string | null
    {
        return this._message;
    }
}
