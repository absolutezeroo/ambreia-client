import type {IAvatarEditorView} from '../view/IAvatarEditorView';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
/**
 * The one thing `FigureData` asks of the editor that owns it.
 *
 * TS-only: AS3's `FigureData` holds a whole `HabboAvatarEditor` and calls exactly one method on it
 * — `getDefaultColour()`, from `getColourIds()` when a part has no colour recorded. Narrowed to
 * that single member so the figure model does not drag the entire editor in behind it;
 * `HabboAvatarEditor` will satisfy this interface as-is when it lands.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::getDefaultColour()
 */
export interface IFigureDataOwner
{
    /**
     * The first selectable colour in the part's palette that the user's club level allows, or −1
     * when the part has no set type, no palette, or nothing affordable in it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::getDefaultColour()
    getDefaultColour(partType: string): number;

    /**
     * The editor's window, for the one thing `FigureDataView` needs from it: the preview slot.
     *
     * AS3's `FigureData` holds the whole `HabboAvatarEditor` and reaches
     * `avatarEditor.view.getFigureContainer()`. This interface was narrowed to a single member back
     * when no view existed; it has to carry that reach now that one does.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::get view()
    readonly view: IAvatarEditorView | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditorManager.as::get avatarRenderManager()
    // The fallback path renders a flat image when the room previewer is not up yet.
    readonly avatarRenderManager: IAvatarRenderManager | null;
}
