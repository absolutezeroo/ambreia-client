import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';
import type {PresetManager} from '../../../uibuilder/PresetManager';
import {TextParam} from '../../../uibuilder/params/TextParam';
import type {AssetButtonPreset} from '../../../uibuilder/presets/AssetButtonPreset';
import type {TextPreset} from '../../../uibuilder/presets/TextPreset';
import {WiredUIPreset} from '../../../uibuilder/presets/WiredUIPreset';
import type {WiredStyle} from '../../../uibuilder/styles/WiredStyle';
import type {VariableFxPreviewPreset} from './VariableFxPreviewPreset';

/**
 * The framed box the preview sits in: a caption, the live effect, a zoom readout and a randomize
 * button.
 *
 * Fixed height, absolute placement — this is one of the few presets that positions its children by
 * hand rather than stacking them, because the preview has to be CENTRED in the box whatever size
 * the effect turned out to be, and the two labels and the button are pinned to its corners.
 *
 * The zoom label is right-aligned by measuring itself, and the caption is then given whatever width
 * is left — which is why `refreshZoomLabel()` runs before the caption is resized rather than after.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/presets/VariableFxPreviewBlockPreset.as
 */
export class VariableFxPreviewBlockPreset extends WiredUIPreset
{
    // AS3: .../presets/VariableFxPreviewBlockPreset.as::HEIGHT
    private static readonly HEIGHT: number = 112;

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::LABEL_LEFT (name derived)
    //   The AS3 constant is `_SafeStr_11673`, value 6.
    private static readonly LABEL_LEFT: number = 6;

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::LABEL_TOP (name derived)
    //   The AS3 constant is `_SafeStr_10834`, value 6.
    private static readonly LABEL_TOP: number = 6;

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::ZOOM_RIGHT
    private static readonly ZOOM_RIGHT: number = 6;

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::BUTTON_RIGHT
    private static readonly BUTTON_RIGHT: number = 5;

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::BUTTON_BOTTOM
    private static readonly BUTTON_BOTTOM: number = 5;

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::_window
    private _window: IWindowContainer | null;

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::_preview (name derived)
    private _preview: VariableFxPreviewPreset | null;

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::_caption (name derived)
    private _caption: TextPreset | null;

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::_zoomLabel (name derived)
    private _zoomLabel: TextPreset | null;

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::_randomizeButton (name derived)
    private _randomizeButton: AssetButtonPreset | null;

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::VariableFxPreviewBlockPreset()
    constructor(
        roomEvents: HabboUserDefinedRoomEvents,
        presetManager: PresetManager,
        wiredStyle: WiredStyle,
        preview: VariableFxPreviewPreset,
        onRandomize: () => void
    )
    {
        super(roomEvents, presetManager, wiredStyle);

        const captionParam = new TextParam(1, true);
        const zoomParam = new TextParam(0, false);

        captionParam.textColor = wiredStyle.softTextColor;
        zoomParam.textColor = wiredStyle.softTextColor;

        this._window = presetManager.createLayout('growing_container_view') as unknown as IWindowContainer;
        this._preview = preview;
        this._caption = presetManager.createText('${wiredfurni.params.variablefx.preview}', captionParam);
        this._zoomLabel = presetManager.createText('', zoomParam);
        this._randomizeButton = presetManager.createAssetButtonPreset(
            'variablefx_randomize', '${wiredfurni.params.variablefx.preview.randomize}', onRandomize
        );

        this._window.addChild(this._preview.window);
        this._window.addChild(this._caption.window);
        this._window.addChild(this._zoomLabel.window);
        this._window.addChild(this._randomizeButton.window);
    }

    /** Re-reads the preview's zoom and re-pins the label to the right edge. */
    // AS3: .../presets/VariableFxPreviewBlockPreset.as::refreshZoomLabel()
    refreshZoomLabel(): void
    {
        if(this._zoomLabel === null || this._preview === null || this._window === null) return;

        this._zoomLabel.text = this._roomEvents.localization.getLocalizationWithParams(
            'wiredfurni.params.variablefx.preview.zoom', 'zoom: %level%', 'level', String(this._preview.zoom)
        );

        this._zoomLabel.window.x = Math.max(
            VariableFxPreviewBlockPreset.LABEL_LEFT,
            this._window.width - this._zoomLabel.width - VariableFxPreviewBlockPreset.ZOOM_RIGHT
        );
    }

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::get window()
    override get window(): IWindow
    {
        return this._window as unknown as IWindow;
    }

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);

        const box = this._window;
        const preview = this._preview;
        const caption = this._caption;
        const zoom = this._zoomLabel;
        const button = this._randomizeButton;

        if(box === null || preview === null || caption === null || zoom === null || button === null) return;

        box.width = width;
        box.height = VariableFxPreviewBlockPreset.HEIGHT;

        preview.resizeToWidth(preview.staticWidth);
        preview.window.x = Math.max(0, ((width - preview.staticWidth) / 2) | 0);
        preview.window.y = Math.max(0, ((VariableFxPreviewBlockPreset.HEIGHT - preview.window.height) / 2) | 0);

        button.resizeToWidth(button.staticWidth);
        button.window.x = Math.max(0, width - button.staticWidth - VariableFxPreviewBlockPreset.BUTTON_RIGHT);
        button.window.y = Math.max(
            0, VariableFxPreviewBlockPreset.HEIGHT - button.window.height - VariableFxPreviewBlockPreset.BUTTON_BOTTOM
        );

        caption.window.x = VariableFxPreviewBlockPreset.LABEL_LEFT;
        caption.window.y = VariableFxPreviewBlockPreset.LABEL_TOP;
        zoom.window.y = VariableFxPreviewBlockPreset.LABEL_TOP;

        // Before the caption is measured: the caption gets whatever the zoom label left behind.
        this.refreshZoomLabel();

        caption.resizeToWidth(Math.max(
            0,
            zoom.window.x - VariableFxPreviewBlockPreset.LABEL_LEFT - this._wiredStyle.genericHorizontalSpacing
        ));
    }

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::get childPresets()
    protected override get childPresets(): WiredUIPreset[]
    {
        const children: WiredUIPreset[] = [];

        if(this._preview !== null) children.push(this._preview);
        if(this._caption !== null) children.push(this._caption);
        if(this._zoomLabel !== null) children.push(this._zoomLabel);
        if(this._randomizeButton !== null) children.push(this._randomizeButton);

        return children;
    }

    // AS3: .../presets/VariableFxPreviewBlockPreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed) return;

        super.dispose();

        this._window?.dispose();
        this._window = null;
        this._preview = null;
        this._caption = null;
        this._zoomLabel = null;
        this._randomizeButton = null;
    }
}
