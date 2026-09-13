import {VariableFxRendererPrebakeCache} from './variablefx/VariableFxRendererPrebakeCache';
import type {VariableFxConfigData} from './variablefx/VariableFxConfigData';

/**
 * The Variable FX configs one visualization knows about, and a generation counter per config.
 *
 * The counter is the point. A config can be REPLACED at the same id — the server re-sends one when
 * a wired effect is edited — and a renderer built against the old one is then holding stale baked
 * artwork. `getConfigUpdateId()` is what lets each stack addition notice that and rebuild, rather
 * than every addition having to compare config contents field by field.
 *
 * Replacing or removing a config also frees whatever the renderers baked onto it, which is why this
 * owns a disposal step at all: the prebake cache is keyed BY the config object, so dropping the
 * reference without telling the cache would leak the bake for the life of the room.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/_SafeCls_1947.as
 */
export class VariableFxConfigStore
{
    /**
     * AS3 uses an `OrderedMap` for both of these. A JS `Map` iterates in insertion order too, and
     * nothing here depends on the order beyond that.
     */
    // AS3: .../visualization/_SafeCls_1947.as::_configs (name derived)
    private _configs: Map<number, VariableFxConfigData> | null = new Map();

    // AS3: .../visualization/_SafeCls_1947.as::_configUpdateIds (name derived)
    private _configUpdateIds: Map<number, number> | null = new Map();

    // AS3: .../visualization/_SafeCls_1947.as::_updateId (name derived)
    private _updateId: number = 0;

    // AS3: .../visualization/_SafeCls_1947.as::_disposed
    private _disposed: boolean = false;

    /** Bumps the store's generation whether or not anything was there before. */
    // AS3: .../visualization/_SafeCls_1947.as::upsertConfig()
    upsertConfig(configId: number, config: VariableFxConfigData): void
    {
        if(this._configs === null || this._configUpdateIds === null) return;

        const previous = this._configs.get(configId) ?? null;
        const updateId = ++this._updateId;

        // Identity, not equality: re-upserting the SAME object must not free the bake it is using.
        if(previous !== null && previous !== config) VariableFxConfigStore.disposeConfig(previous);

        this._configs.set(configId, config);
        this._configUpdateIds.set(configId, updateId);
    }

    // AS3: .../visualization/_SafeCls_1947.as::removeConfig()
    removeConfig(configId: number): void
    {
        if(this._configs === null || this._configUpdateIds === null) return;

        const previous = this._configs.get(configId) ?? null;

        if(previous === null) return;

        this._configs.delete(configId);

        VariableFxConfigStore.disposeConfig(previous);

        this._configUpdateIds.delete(configId);
        this._updateId += 1;
    }

    // AS3: .../visualization/_SafeCls_1947.as::getConfig()
    getConfig(configId: number): VariableFxConfigData | null
    {
        return this._configs === null ? null : this._configs.get(configId) ?? null;
    }

    // AS3: .../visualization/_SafeCls_1947.as::getConfigUpdateId()
    getConfigUpdateId(configId: number): number
    {
        return this._configUpdateIds === null ? 0 : this._configUpdateIds.get(configId) ?? 0;
    }

    // AS3: .../visualization/_SafeCls_1947.as::clear()
    clear(): void
    {
        if(this._configs === null || this._configUpdateIds === null) return;

        if(this._configs.size > 0) this._updateId += 1;

        for(const config of this._configs.values()) VariableFxConfigStore.disposeConfig(config);

        this._configs.clear();
        this._configUpdateIds.clear();
    }

    /** The store's own generation — bumped by every upsert, remove and non-empty clear. */
    // AS3: .../visualization/_SafeCls_1947.as::get updateId()
    get updateId(): number
    {
        return this._updateId;
    }

    // AS3: .../visualization/_SafeCls_1947.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../visualization/_SafeCls_1947.as::disposeConfig()
    private static disposeConfig(config: VariableFxConfigData): void
    {
        VariableFxRendererPrebakeCache.disposeConfigPrebake(config);
    }

    // AS3: .../visualization/_SafeCls_1947.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this.clear();

        this._configs = null;
        this._configUpdateIds = null;
        this._disposed = true;
    }
}
