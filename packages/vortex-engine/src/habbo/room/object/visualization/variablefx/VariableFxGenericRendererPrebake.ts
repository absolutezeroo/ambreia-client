import type {IVariableFxRendererPrebake} from './IVariableFxRendererPrebake';

/**
 * Artwork a renderer baked once for a config, plus how to free it.
 *
 * `data` is untyped on purpose — AS3 types it `Object` and every renderer puts a different shape in
 * it. The renderer that created it is the only thing that reads it, so narrowing it here would be
 * inventing a contract none of them share.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxGenericRendererPrebake.as
 */
export class VariableFxGenericRendererPrebake implements IVariableFxRendererPrebake
{
    // AS3: .../variablefx/VariableFxGenericRendererPrebake.as::data
    data: unknown;

    // AS3: .../variablefx/VariableFxGenericRendererPrebake.as::_disposeCallback
    private _disposeCallback: (() => void) | null;

    // AS3: .../variablefx/VariableFxGenericRendererPrebake.as::VariableFxGenericRendererPrebake()
    constructor(data: unknown, disposeCallback: (() => void) | null)
    {
        this.data = data;
        this._disposeCallback = disposeCallback;
    }

    // AS3: .../variablefx/VariableFxGenericRendererPrebake.as::dispose()
    dispose(): void
    {
        if(this._disposeCallback !== null)
        {
            this._disposeCallback();
            this._disposeCallback = null;
        }

        this.data = null;
    }
}
