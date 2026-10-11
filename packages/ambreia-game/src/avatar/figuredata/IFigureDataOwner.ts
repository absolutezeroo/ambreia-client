import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
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
     * The first selectable colour in the part's palette, or −1 when the part has no set type,
     * no palette, or no selectable colour.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::getDefaultColour()
    getDefaultColour(partType: string): number;

    /** The preview slot used by `FigureDataView`. */
    getFigureContainer(): IWidgetWindow | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditorManager.as::get avatarRenderManager()
    // The fallback path renders a flat image when the room previewer is not up yet.
    readonly avatarRenderManager: IAvatarRenderManager | null;
}
