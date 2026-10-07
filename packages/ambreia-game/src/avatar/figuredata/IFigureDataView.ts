/**
 * The preview an editable figure pushes itself into.
 *
 * `FigureData` calls exactly one method on its view, with the figure string it has just serialised,
 * the effect to wear and the direction to face. Everything else about the preview — the room
 * previewer, the fallback to a flat rendered image — belongs to the implementation.
 *
 * TS-only: AS3's `FigureData` holds the concrete `FigureDataView`, which reaches back through
 * `avatarEditor.view.getFigureContainer()` to find its previewer widget. Extracted to an interface
 * here so the figure model can be ported, and verified, before `AvatarEditorView` exists — see
 * `FigureData` for what that costs.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/figuredata/FigureDataView.as
 */
export interface IFigureDataView
{
    // AS3: .../avatar/figuredata/FigureDataView.as::update()
    update(figureString: string, effectType?: number, direction?: number): void;

    // AS3: .../avatar/figuredata/FigureDataView.as::dispose()
    dispose(): void;

    // AS3: .../avatar/figuredata/FigureDataView.as::get disposed()
    readonly disposed: boolean;
}
