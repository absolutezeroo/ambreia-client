import {VariableFxLogicConfigManager} from './VariableFxLogicConfigManager';

/**
 * The furniture twin of {@link AvatarLogicRoomData} — same shape, separate store, because a config
 * is either a user effect or a furniture one and never both.
 *
 * Class name derived: the AS3 class is obfuscated (`_SafeCls_2037`) and exists in no other tree.
 * Named from `RoomObjectFactory.getFurnitureLogicRoomData()`, which is readable and returns it.
 *
 * @see sources/AIR-1.0.31/scripts/com/sulake/habbo/room/object/logic/_SafeCls_2037.as
 */
export class FurnitureLogicRoomData
{
    private _variableFxLogicManager: VariableFxLogicConfigManager | null = new VariableFxLogicConfigManager();

    // AS3: .../room/object/logic/_SafeCls_2037.as::get variableFxLogicManager()
    get variableFxLogicManager(): VariableFxLogicConfigManager | null
    {
        return this._variableFxLogicManager;
    }

    // AS3: .../room/object/logic/_SafeCls_2037.as::dispose()
    dispose(): void
    {
        if(this._variableFxLogicManager !== null)
        {
            this._variableFxLogicManager.dispose();
            this._variableFxLogicManager = null;
        }
    }
}
