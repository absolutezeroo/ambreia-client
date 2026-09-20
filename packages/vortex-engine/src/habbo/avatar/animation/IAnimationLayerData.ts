import type {IActiveActionData} from '../actions/IActiveActionData';

/**
 * Interface for animation layer data containing frame offsets and action reference.
 *
 * The primary tree has this interface as `_SafeCls_2715` (identified by `AnimationLayerData
 * implements _SafeCls_2715`); its member names are readable, so the traces point there rather than
 * at the 2016 `IAnimationLayerData.as`, which is where `dd` came from — the 2026 build renamed that
 * member `directionOffset`, and the port had kept the 2016 spelling.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/_SafeCls_2715.as
 */
export interface IAnimationLayerData
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/_SafeCls_2715.as::get id()
    readonly id: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/_SafeCls_2715.as::get action()
    readonly action: IActiveActionData;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/_SafeCls_2715.as::get animationFrame()
    readonly animationFrame: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/_SafeCls_2715.as::get dx()
    readonly dx: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/_SafeCls_2715.as::get dy()
    readonly dy: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/_SafeCls_2715.as::get dz()
    readonly dz: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/_SafeCls_2715.as::get directionOffset()
    readonly directionOffset: number;
}
