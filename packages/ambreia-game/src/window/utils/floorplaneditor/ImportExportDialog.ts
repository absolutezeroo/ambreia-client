import type {IWindow} from '@ambreia/ui/IWindow';
import type {IFrameWindow} from '@ambreia/ui/components/IFrameWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {
    UpdateFloorPropertiesMessageComposer
} from '@ambreia/protocol/outgoing/room/layout/UpdateFloorPropertiesMessageComposer';
import {BCFloorPlanEditor} from './BCFloorPlanEditor';

/**
 * ImportExportDialog — the plan as editable text, for pasting one in or copying one out.
 *
 * It saves the **text box's** contents rather than the cache's, which is the whole point: a plan
 * pasted in here has never been through `FloorPlanCache` and is sent exactly as typed. Its save is
 * also the short form of the composer — six fields, no wall height — where the main window's Save
 * sends seven.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/floorplaneditor/ImportExportDialog.as
 */
export class ImportExportDialog
{
    // AS3: ImportExportDialog.as::_bcFloorPlanEditor
    private _bcFloorPlanEditor: BCFloorPlanEditor;

    /**
     * AS3 is handed the parsed layout XML; this port is handed the name the layout registry knows
     * it by, because building goes through the window manager's layout map rather than an
     * `IAssetLibrary` the component owns.
     */
    // AS3: ImportExportDialog.as::_layout
    private _layoutName: string;

    // AS3: ImportExportDialog.as::_window
    private _window: IFrameWindow | null = null;

    // AS3: ImportExportDialog.as::ImportExportDialog()
    constructor(bcFloorPlanEditor: BCFloorPlanEditor, layoutName: string)
    {
        this._bcFloorPlanEditor = bcFloorPlanEditor;
        this._layoutName = layoutName;
    }

    // AS3: ImportExportDialog.as::set visible()
    set visible(value: boolean)
    {
        if(this._window === null)
        {
            this._window = this._bcFloorPlanEditor.windowManager
                ?.buildWidgetLayout(this._layoutName) as IFrameWindow | null ?? null;

            if(this._window === null) return;

            this._window.center();
            this._window.procedure = this.windowProcedure;
        }

        if(!value)
        {
            this._window.visible = false;

            return;
        }

        this._window.visible = true;

        const data = this._window.findChildByName('data');

        if(data !== null) data.caption = this._bcFloorPlanEditor.floorPlanCache.getData();

        if(this._bcFloorPlanEditor.canSave) this._window.findChildByName('save')?.enable();
        else this._window.findChildByName('save')?.disable();

        this._window.activate();
    }

    // AS3: ImportExportDialog.as::get visible()
    get visible(): boolean
    {
        if(this._window === null) return false;

        return this._window.visible;
    }

    // AS3: ImportExportDialog.as::windowProcedure()
    private windowProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        switch(window.name)
        {
            case 'header_button_close':
                this.visible = false;
                break;
            case 'revert':
            {
                const data = this._window?.findChildByName('data') ?? null;

                if(data !== null) data.caption = this._bcFloorPlanEditor.lastReceivedFloorPlan;
                break;
            }
            case 'save':
            {
                const cache = this._bcFloorPlanEditor.floorPlanCache;
                const entryPoint = cache.entryPoint;
                const text = this._window?.findChildByName('data')?.caption ?? '';

                // AS3 dereferences entryPoint without a guard here; it is set from the door reply
                // that arrives with the editor, and a null one would throw rather than send a
                // half-formed message. Guarded instead, which changes nothing when it is present.
                if(entryPoint === null) return;

                this._bcFloorPlanEditor.windowManager?.communication?.connection?.send(
                    new UpdateFloorPropertiesMessageComposer(
                        text,
                        entryPoint.x,
                        entryPoint.y,
                        cache.entryPointDir,
                        BCFloorPlanEditor.getThicknessSettingBySelectionIndex(
                            this._bcFloorPlanEditor.wallThickness
                        ),
                        BCFloorPlanEditor.getThicknessSettingBySelectionIndex(
                            this._bcFloorPlanEditor.floorThickness
                        )
                    )
                );
                break;
            }
        }
    };
}
