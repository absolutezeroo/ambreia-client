import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session pet package event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionPetPackageEvent.as
 */
export class RoomSessionPetPackageEvent extends RoomSessionEvent
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPetPackageEvent.as::RSOPPE_OPEN_PET_PACKAGE_REQUESTED
    public static readonly RSOPPE_OPEN_PET_PACKAGE_REQUESTED = 'RSOPPE_OPEN_PET_PACKAGE_REQUESTED';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPetPackageEvent.as::RSOPPE_OPEN_PET_PACKAGE_RESULT
    public static readonly RSOPPE_OPEN_PET_PACKAGE_RESULT = 'RSOPPE_OPEN_PET_PACKAGE_RESULT';

    constructor(
        type: string,
        session: IRoomSession,
        objectId: number,
        figureData: unknown = null,
        nameValidationStatus: number = 0,
        nameValidationInfo: string | null = null
    )
    {
        super(type, session);
        this._objectId = objectId;
        this._figureData = figureData;
        this._nameValidationStatus = nameValidationStatus;
        this._nameValidationInfo = nameValidationInfo;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPetPackageEvent.as::_objectId
    private _objectId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetPackageEvent.as::get objectId()
    get objectId(): number
    {
        return this._objectId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPetPackageEvent.as::_figureData
    private _figureData: unknown;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetPackageEvent.as::get figureData()
    get figureData(): unknown
    {
        return this._figureData;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetPackageEvent.as::_nameValidationStatus
    private _nameValidationStatus: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetPackageEvent.as::get nameValidationStatus()
    get nameValidationStatus(): number
    {
        return this._nameValidationStatus;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetPackageEvent.as::_nameValidationInfo
    private _nameValidationInfo: string | null;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetPackageEvent.as::get nameValidationInfo()
    get nameValidationInfo(): string | null
    {
        return this._nameValidationInfo;
    }
}
