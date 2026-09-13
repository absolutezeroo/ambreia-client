import type {VariableFxFrame} from './VariableFxFrame';
import type {VariableFxRendererContext} from './VariableFxRendererContext';

/**
 * What every VariableFx renderer is, from the outside: something that owns one frame and knows
 * when that frame has gone stale.
 *
 * The split between `needsUpdate()` and `update()` is what keeps the feature off the frame budget —
 * the visualizer asks first and only redraws when told to. `isContinuous` is the exception: a
 * renderer that animates says so, and is then ticked regardless.
 *
 * Named with the port's `I` prefix; the AS3 interface is `VariableFxRenderer`, unprefixed.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxRenderer.as
 */
export interface IVariableFxRenderer
{
    // AS3: .../variablefx/VariableFxRenderer.as::get frame()
    readonly frame: VariableFxFrame;

    // AS3: .../variablefx/VariableFxRenderer.as::get isContinuous()
    readonly isContinuous: boolean;

    // AS3: .../variablefx/VariableFxRenderer.as::updateData()
    updateData(context: VariableFxRendererContext, time: number): void;

    // AS3: .../variablefx/VariableFxRenderer.as::needsUpdate()
    needsUpdate(time: number): boolean;

    // AS3: .../variablefx/VariableFxRenderer.as::update()
    update(time: number): boolean;

    // AS3: .../variablefx/VariableFxRenderer.as::dispose()
    dispose(): void;
}

/**
 * How the registry builds one. AS3 stores bare `Function`s in an untyped object; this is the same
 * thing with the signature written down.
 */
// AS3: .../variablefx/VariableFxRendererRegistry.as::registerRendererFactory()
export type VariableFxRendererFactory = (context: VariableFxRendererContext) => IVariableFxRenderer;
