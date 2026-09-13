import {VariableFxLogicConfigManager} from './VariableFxLogicConfigManager';

/**
 * Everything the *avatar* logic of one room needs that outlives any single object — today only the
 * VariableFx config store, which is why the class looks thin.
 *
 * It has to be per-room and per-half: `RoomObjectFactory` keeps one of these and one
 * `FurnitureLogicRoomData` for each room identifier, and routes a config to whichever the
 * `isUserFx` flag names.
 *
 * Class name derived: the AS3 class is obfuscated (`_SafeCls_2017`) and exists in no other tree.
 * Named from `RoomObjectFactory.getAvatarLogicRoomData()`, which is readable and returns it.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/logic/_SafeCls_2017.as
 */
export class AvatarLogicRoomData
{
    private _variableFxLogicManager: VariableFxLogicConfigManager | null = new VariableFxLogicConfigManager();

    // AS3: .../room/object/logic/_SafeCls_2017.as::get variableFxLogicManager()
    get variableFxLogicManager(): VariableFxLogicConfigManager | null
    {
        return this._variableFxLogicManager;
    }

    // AS3: .../room/object/logic/_SafeCls_2017.as::dispose()
    dispose(): void
    {
        if(this._variableFxLogicManager !== null)
        {
            this._variableFxLogicManager.dispose();
            this._variableFxLogicManager = null;
        }
    }
}
