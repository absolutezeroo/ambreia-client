/**
 * Artwork a renderer bakes once per config and reuses for every effect drawn from it — recoloured
 * bar slices, digit sheets, heart masks.
 *
 * One member, because the only thing the rest of the system does with a prebake is hold it for
 * identity (`VariableFxVisualizer` stops drawing when its config's prebake has been replaced) and
 * eventually free it. Each renderer's own prebake class is what actually knows the shape.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/_SafeCls_4064.as
 */
export interface IVariableFxRendererPrebake
{
    // AS3: .../variablefx/_SafeCls_4064.as::dispose()
    dispose(): void;
}
