import {OrderedMap} from '@core/utils/OrderedMap';
import type {VariableFxLogicConfig} from './VariableFxLogicConfig';

/**
 * The VariableFx configurations in force for one half of one room — avatars or furniture, never
 * both, which is why there are two of these per room.
 *
 * The `updateId` is the point of the class as much as the storage is: every mutation bumps it, and
 * an object's logic compares the number it last saw against this one to know its configs went
 * stale. Without that the only alternative is diffing the configs on every frame.
 *
 * Class name derived: the AS3 class is obfuscated (`_SafeCls_2984`) and exists in no other tree.
 * Named from the accessor every holder exposes it under, `variableFxLogicManager`, which is
 * readable — `Config` added because that is all it holds.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/logic/_SafeCls_2984.as
 */
export class VariableFxLogicConfigManager
{
    // AS3: .../room/object/logic/_SafeCls_2984.as::_configs (name derived)
    private _configs: OrderedMap<number, VariableFxLogicConfig> | null = new OrderedMap();

    // AS3: .../room/object/logic/_SafeCls_2984.as::_updateId (name derived)
    private _updateId: number = 0;

    private _disposed: boolean = false;

    // AS3: .../room/object/logic/_SafeCls_2984.as::upsertConfig()
    upsertConfig(config: VariableFxLogicConfig): void
    {
        if(this._configs === null) return;

        this._updateId += 1;
        config.updateId = this._updateId;

        if(this._configs.hasKey(config.configId))
        {
            this._configs.replace(config.configId, config);
        }
        else
        {
            this._configs.add(config.configId, config);
        }
    }

    // AS3: .../room/object/logic/_SafeCls_2984.as::getConfig()
    getConfig(configId: number): VariableFxLogicConfig | null
    {
        return this._configs?.getValue(configId) ?? null;
    }

    /**
     * Bumps `updateId` only when something was actually removed — a remove for a config that was
     * never here must not make every object recompute.
     */
    // AS3: .../room/object/logic/_SafeCls_2984.as::removeConfig()
    removeConfig(configId: number): void
    {
        if(this._configs === null) return;

        if(this._configs.remove(configId) !== null) this._updateId += 1;
    }

    // AS3: .../room/object/logic/_SafeCls_2984.as::clear()
    clear(): void
    {
        if(this._configs === null) return;

        if(this._configs.length > 0) this._updateId += 1;

        this._configs.reset();
    }

    // AS3: .../room/object/logic/_SafeCls_2984.as::get updateId()
    get updateId(): number
    {
        return this._updateId;
    }

    // AS3: .../room/object/logic/_SafeCls_2984.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../room/object/logic/_SafeCls_2984.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this.clear();
        this._configs?.dispose();
        this._configs = null;
        this._disposed = true;
    }
}
