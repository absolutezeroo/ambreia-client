import type {IDisposable} from '@core/runtime/IDisposable';
import {RoomEngineEvent} from '@habbo/room/events/RoomEngineEvent';
import type {IUpdateReceiver} from '@core/runtime/IContext';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IWindow} from '@core/window/IWindow';
import type {IFrameWindow} from '@core/window/components/IFrameWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {IScrollbarWindow} from '@core/window/components/IScrollbarWindow';
import type {IDropMenuWindow} from '@core/window/components/IDropMenuWindow';
import type {ISelectableWindow} from '@core/window/components/ISelectableWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IAvatarImageWidget} from '@habbo/window/widgets/IAvatarImageWidget';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {WindowState} from '@core/window/enum/WindowState';
import {Logger} from '@core/utils/Logger';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import {
    FloorHeightMapMessageEvent
} from '@habbo/communication/messages/incoming/room/engine/FloorHeightMapMessageEvent';
import type {
    FloorHeightMapMessageParser
} from '@habbo/communication/messages/parser/room/engine/FloorHeightMapMessageParser';
import {RoomEntryTileMessageEvent} from '@habbo/communication/messages/incoming/room/layout/RoomEntryTileMessageEvent';
import type {
    RoomEntryTileMessageParser
} from '@habbo/communication/messages/parser/room/layout/RoomEntryTileMessageParser';
import {
    RoomOccupiedTilesMessageEvent
} from '@habbo/communication/messages/incoming/room/layout/RoomOccupiedTilesMessageEvent';
import {
    RoomVisualizationSettingsEvent
} from '@habbo/communication/messages/incoming/room/engine/RoomVisualizationSettingsEvent';
import type {
    RoomVisualizationSettingsEventParser
} from '@habbo/communication/messages/parser/room/engine/RoomVisualizationSettingsEventParser';
import {PerkAllowancesMessageEvent} from '@habbo/communication/messages/incoming/perk/PerkAllowancesMessageEvent';
import type {
    PerkAllowancesMessageEventParser
} from '@habbo/communication/messages/parser/perk/PerkAllowancesMessageEventParser';
import {
    GetOccupiedTilesMessageComposer
} from '@habbo/communication/messages/outgoing/room/layout/GetOccupiedTilesMessageComposer';
import {
    GetRoomEntryTileMessageComposer
} from '@habbo/communication/messages/outgoing/room/layout/GetRoomEntryTileMessageComposer';
import {
    UpdateFloorPropertiesMessageComposer
} from '@habbo/communication/messages/outgoing/room/layout/UpdateFloorPropertiesMessageComposer';
import {FloorPlanCache} from './FloorPlanCache';
import {FloorPlanPreviewer} from './FloorPlanPreviewer';
import {HeightMapEditor} from './HeightMapEditor';
import {ImportExportDialog} from './ImportExportDialog';
import {PerkType} from '../../../communication/enum/PerkType';

const log = Logger.getLogger('habbo.window.utils.floorplaneditor.BCFloorPlanEditor');

/**
 * BCFloorPlanEditor — the room floor plan editor. The AS3 name is kept; the fork removed the
 * Builders Club itself (subscription status, countdown), so only the staff half of the save gate
 * remains — see {@link canSave}.
 *
 * Owns the window, the five subscriptions that fill it and the three pieces that draw it: the
 * {@link FloorPlanCache} data model, the {@link HeightMapEditor} you draw on and the
 * {@link FloorPlanPreviewer} that shows the result. It is an update receiver so the preview can
 * refresh on a timer rather than on every stroke.
 *
 * **Saving does not currently reach anything.** The two requests this sends on open have real
 * handlers on `vortex-emulator`; `UpdateFloorProperties` (2937) is accepted and dropped there, so
 * the editor loads and draws faithfully and Save is a no-op server-side. That is a server gap, not
 * a missing piece here — the composer is correct and registered.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/floorplaneditor/BCFloorPlanEditor.as
 */
export class BCFloorPlanEditor implements IUpdateReceiver, IDisposable
{
    // AS3: BCFloorPlanEditor.as::PREVIEW_UPDATE_MS
    private static readonly PREVIEW_UPDATE_MS: number = 2000;

    // AS3: BCFloorPlanEditor.as::WALL_HEIGHT_LIMIT
    private static readonly WALL_HEIGHT_LIMIT: number = 16;

    /** The two layouts, by the names the asset build ships them under. */
    // AS3: BCFloorPlanEditor.as::floor_plan_editor_layout / floor_plan_editor_export_import
    private static readonly EDITOR_LAYOUT: string = 'floor_plan_editor_bc_xml';
    // AS3: BCFloorPlanEditor.as::floor_plan_editor_export_import
    private static readonly EXPORT_IMPORT_LAYOUT: string = 'floor_plan_export_import_xml';

    /** The security level that may save. */
    // AS3: BCFloorPlanEditor.as::onBcCountdownTimerEvent() (hasSecurity(4))
    private static readonly SECURITY_LEVEL_STAFF: number = 4;

    // AS3: BCFloorPlanEditor.as::_windowManager
    private _windowManager: IHabboWindowManager | null;

    // AS3: BCFloorPlanEditor.as::_floorHeightMapMessageEvent
    private _floorHeightMapMessageEvent: IMessageEvent | null = null;

    // AS3: BCFloorPlanEditor.as::_entryTileDataMessageEvent
    private _entryTileDataMessageEvent: IMessageEvent | null = null;

    // AS3: BCFloorPlanEditor.as::_occupiedTilesMessageEvent
    private _occupiedTilesMessageEvent: IMessageEvent | null = null;

    // AS3: BCFloorPlanEditor.as::_roomVisualizationSettingsMessageEvent
    private _roomVisualizationSettingsMessageEvent: IMessageEvent | null = null;

    // AS3: BCFloorPlanEditor.as::_perkAllowancesMessageEvent
    private _perkAllowancesMessageEvent: IMessageEvent | null = null;

    // AS3: BCFloorPlanEditor.as::_floorPlanCache
    private _floorPlanCache: FloorPlanCache;

    // AS3: BCFloorPlanEditor.as::_floorPlanPreviewer
    private _floorPlanPreviewer: FloorPlanPreviewer | null = null;

    // AS3: BCFloorPlanEditor.as::_heightMapEditor
    private _heightMapEditor: HeightMapEditor | null = null;

    // AS3: BCFloorPlanEditor.as::_importExportDialog
    private _importExportDialog: ImportExportDialog | null = null;

    /** Kept so Reload can re-apply the last map the server sent without asking for it again. */
    // AS3: BCFloorPlanEditor.as::_lastReceivedMapEvent
    private _lastReceivedMapEvent: IMessageEvent | null = null;

    // AS3: BCFloorPlanEditor.as::_editorWindow
    private _editorWindow: IFrameWindow | null = null;

    /** The five tool buttons, by window name — the order is also `applyDraw()`'s switch order. */
    // AS3: BCFloorPlanEditor.as::_drawModes
    private _drawModes: string[] = [
        'add_tile', 'remove_tile', 'increase_height', 'decrease_height', 'set_enter_tile',
    ];

    // AS3: BCFloorPlanEditor.as::_drawMode
    private _drawMode: string = 'add_tile';

    // AS3: BCFloorPlanEditor.as::_floorThickness
    private _floorThickness: number = 0;

    // AS3: BCFloorPlanEditor.as::_wallThickness
    private _wallThickness: number = 0;

    // AS3: BCFloorPlanEditor.as::_msSinceLastPreviewUpdate
    private _msSinceLastPreviewUpdate: number = 0;

    // AS3: BCFloorPlanEditor.as::_largeFloorPlansAllowed
    private _largeFloorPlansAllowed: boolean = false;

    // AS3: BCFloorPlanEditor.as::_fixedWallsHeight
    private _fixedWallsHeight: number = -1;

    // AS3: BCFloorPlanEditor.as::_colorMapMouseDown
    private _colorMapMouseDown: boolean = false;

    // AS3: BCFloorPlanEditor.as::_wallHeightSliderMouseDown
    private _wallHeightSliderMouseDown: boolean = false;

    // AS3: BCFloorPlanEditor.as::BCFloorPlanEditor()
    constructor(windowManager: IHabboWindowManager)
    {
        this._floorPlanCache = new FloorPlanCache(this);
        this._windowManager = windowManager;

        const communication = windowManager.communication;

        if(communication !== null)
        {
            this._floorHeightMapMessageEvent = new FloorHeightMapMessageEvent(this.onFloorHeightMap);
            this._entryTileDataMessageEvent = new RoomEntryTileMessageEvent(this.onEntryTileData);
            this._occupiedTilesMessageEvent = new RoomOccupiedTilesMessageEvent(this.onOccupiedTiles);
            this._roomVisualizationSettingsMessageEvent =
                new RoomVisualizationSettingsEvent(this.onRoomVisualizationSettings);
            this._perkAllowancesMessageEvent = new PerkAllowancesMessageEvent(this.onPerkAllowances);

            communication.addHabboConnectionMessageEvent(this._floorHeightMapMessageEvent);
            communication.addHabboConnectionMessageEvent(this._entryTileDataMessageEvent);
            communication.addHabboConnectionMessageEvent(this._occupiedTilesMessageEvent);
            communication.addHabboConnectionMessageEvent(this._roomVisualizationSettingsMessageEvent);
            communication.addHabboConnectionMessageEvent(this._perkAllowancesMessageEvent);
        }
        else
        {
            // The editor is deaf *and* mute without this: no FloorHeightMap, and `set visible()`
            // cannot send GetOccupiedTiles/GetRoomEntryTile either. AS3 builds this class only from
            // `onConfigurationComplete()`, where the manager is always in; here it can also be built
            // lazily by `displayFloorPlanEditor()`, and this says when that happened too early.
            log.warn('Floor plan editor built with no communication manager — it will receive no'
                + ' floor height map and can send no requests.');
        }

        windowManager.roomEngine?.events?.on(RoomEngineEvent.REE_DISPOSED, this.onRoomDisposed);
        windowManager.registerUpdateReceiver(this, 0);
    }

    /**
     * AS3: BCFloorPlanEditor.as::getThicknessSettingBySelectionIndex()
     *
     * The dropdown index is not the wire value: index 2 is "normal" and maps to 0, and the scale
     * runs -2, -1, 0, 1 rather than 0..3.
     */
    // AS3: BCFloorPlanEditor.as::getThicknessSettingBySelectionIndex()
    public static getThicknessSettingBySelectionIndex(index: number): number
    {
        switch(index)
        {
            case 0: return -2;
            case 1: return -1;
            case 3: return 1;
            default: return 0;
        }
    }

    /** True while the player may save — staff only. */
    // DEVIATION: AS3 also allows saving while Builders Club time is left (`_bcSecondsLeft`, fed by
    //   BuildersClubSubscriptionStatus and ticked down by a 10s timer). The RPG fork removed the
    //   Builders Club, so that half of the gate, its subscription and its timer are gone.
    // AS3: BCFloorPlanEditor.as::onBcCountdownTimerEvent() / ImportExportDialog.as::set visible()
    get canSave(): boolean
    {
        return this._windowManager?.sessionDataManager?.hasSecurity(BCFloorPlanEditor.SECURITY_LEVEL_STAFF) ?? false;
    }

    // AS3: BCFloorPlanEditor.as::set visible()
    set visible(value: boolean)
    {
        if(this._editorWindow === null || this._editorWindow.disposed)
        {
            if(!value) return;

            this.createEditorWindow();

            if(this._editorWindow === null) return;
        }

        this._editorWindow.visible = value;

        if(!value)
        {
            if(this._heightMapEditor !== null) this._heightMapEditor.colorPickMode = false;

            return;
        }

        const connection = this._windowManager?.communication?.connection ?? null;

        connection?.send(new GetOccupiedTilesMessageComposer());
        connection?.send(new GetRoomEntryTileMessageComposer());

        this.updateThicknessSelection();
        this.centerScrollableViews();
        this.updateWallHeight(this._fixedWallsHeight);
    }

    // AS3: BCFloorPlanEditor.as::get visible()
    get visible(): boolean
    {
        return this._editorWindow !== null && this._editorWindow.visible;
    }

    // AS3: BCFloorPlanEditor.as::createEditorWindow()
    private createEditorWindow(): void
    {
        this._editorWindow = this._windowManager
            ?.buildWidgetLayout(BCFloorPlanEditor.EDITOR_LAYOUT, 1) as IFrameWindow | null ?? null;

        if(this._editorWindow === null)
        {
            log.warn(`${BCFloorPlanEditor.EDITOR_LAYOUT} is not in the layout registry`);

            return;
        }

        this._editorWindow.procedure = this.editorWindowProcedure;

        const colorMap = this._editorWindow.findChildByName('tile_height_colormap');
        const wallHeightSlider = this._editorWindow.findChildByName('wall_height_slider');

        if(colorMap !== null) colorMap.procedure = this.colorMapWindowProcedure;
        if(wallHeightSlider !== null) wallHeightSlider.procedure = this.wallHeightSliderProcedure;

        this._editorWindow.center();

        this._floorPlanPreviewer = new FloorPlanPreviewer(this);
        this._heightMapEditor = new HeightMapEditor(this);
        this._importExportDialog = new ImportExportDialog(this, BCFloorPlanEditor.EXPORT_IMPORT_LAYOUT);

        this._floorPlanPreviewer.updatePreview();
        this._heightMapEditor.refreshFromCache();
        this.createTileHeightColorMap(this._heightMapEditor.heigthColorMap);
        this.setDrawMode('add_tile');

        // The third way both panels come up blank, after "no tile art" and "no 2d context": the
        // plan itself is empty. `FloorHeightMapMessageEvent` is a room-entry message and this class
        // subscribes at configuration-complete precisely so it cannot be missed — if it is missed
        // anyway, every draw below is a legal no-op and says nothing.
        if(this._floorPlanCache.floorWidth <= 0 || this._floorPlanCache.floorHeight <= 0)
        {
            log.warn('Floor plan editor opened with an empty plan'
                + ` (${this._floorPlanCache.floorWidth}x${this._floorPlanCache.floorHeight},`
                + ` receivedHeightMap=${this._lastReceivedMapEvent !== null})`
                + ' — both panels stay blank. `false` means this editor was built after the message'
                + ' went by; `true` means it arrived and carried no model data.');
        }

        if(!this.canSave) this._editorWindow.findChildByName('save')?.disable();
    }

    /**
     * AS3: BCFloorPlanEditor.as::update()
     *
     * Two jobs per frame: keep the active tool's button looking pressed, and refresh the preview
     * every two seconds rather than on every stroke.
     */
    // AS3: BCFloorPlanEditor.as::update()
    update(deltaMs: number): void
    {
        if(this._drawMode !== '' && this._editorWindow !== null)
        {
            for(const mode of this._drawModes)
            {
                const button = this._editorWindow.findChildByName(mode);

                if(button === null) continue;

                if(this._drawMode === mode) button.state = button.state | WindowState.PRESSED;
                else button.state = button.state & ~WindowState.PRESSED;
            }
        }

        this._msSinceLastPreviewUpdate += deltaMs;

        if(this._msSinceLastPreviewUpdate > BCFloorPlanEditor.PREVIEW_UPDATE_MS
            && this._floorPlanPreviewer !== null)
        {
            this._floorPlanPreviewer.updatePreview();
            this._msSinceLastPreviewUpdate = 0;
        }
    }

    // AS3: BCFloorPlanEditor.as::get isWallHeightSettingSelected()
    private get isWallHeightSettingSelected(): boolean
    {
        const checkbox = this._editorWindow
            ?.findChildByName('walls_fixed_height_enabled_checkbox') as unknown as ISelectableWindow | null;

        return checkbox?.isSelected ?? false;
    }

    // AS3: BCFloorPlanEditor.as::editorWindowProcedure()
    private editorWindowProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        switch(window.name)
        {
            case 'header_button_close':
            case 'cancel':
                this.visible = false;
                break;
            case 'refresh':
                this._floorPlanPreviewer?.updatePreview();
                break;
            case 'save':
                this.sendSave();
                break;
            case 'reload':
                this.reload();
                break;
            case 'import_export':
                if(this._importExportDialog !== null)
                {
                    this._importExportDialog.visible = !this._importExportDialog.visible;
                }
                break;
            case 'enterdirection_left':
                this._floorPlanCache.entryPointDir = this._floorPlanCache.entryPointDir + 1;
                this.updateEntryDirectionAvatar();
                break;
            case 'enterdirection_right':
                this._floorPlanCache.entryPointDir = this._floorPlanCache.entryPointDir - 1;
                this.updateEntryDirectionAvatar();
                break;
            case 'zoom':
                if(this._heightMapEditor !== null)
                {
                    this._heightMapEditor.zoomLevel = this._heightMapEditor.zoomLevel === 1 ? 2 : 1;
                    this._heightMapEditor.refreshFromCache();
                }
                break;
            case 'walls_fixed_height_enabled_checkbox':
                this.enableWallHeightControls(this.isWallHeightSettingSelected);

                if(this.isWallHeightSettingSelected && this._fixedWallsHeight === -1)
                {
                    const caption = this._editorWindow?.findChildByName('wall_height_number')?.caption ?? '1';

                    this._fixedWallsHeight = parseInt(caption, 10) - 1;
                }
                break;
        }

        if(this._drawModes.indexOf(window.name) !== -1) this.setDrawMode(window.name);
    };

    /** The main window's Save — the seven-field form, wall height included. */
    // AS3: BCFloorPlanEditor.as::editorWindowProcedure() (the "save" branch)
    private sendSave(): void
    {
        if(this._editorWindow === null) return;

        const wallDrop = this._editorWindow.findChildByName('wall_thickness_drop') as unknown as IDropMenuWindow | null;
        const floorDrop = this._editorWindow.findChildByName('floor_thickness_drop') as unknown as IDropMenuWindow | null;

        this._floorThickness = floorDrop?.selection ?? this._floorThickness;
        this._wallThickness = wallDrop?.selection ?? this._wallThickness;

        const entryPoint = this._floorPlanCache.entryPoint;

        // AS3 dereferences the entry point unguarded; it arrives with the editor's own request.
        if(entryPoint === null) return;

        this._windowManager?.communication?.connection?.send(
            new UpdateFloorPropertiesMessageComposer(
                this._floorPlanCache.getData(),
                entryPoint.x,
                entryPoint.y,
                this._floorPlanCache.entryPointDir,
                BCFloorPlanEditor.getThicknessSettingBySelectionIndex(this._wallThickness),
                BCFloorPlanEditor.getThicknessSettingBySelectionIndex(this._floorThickness),
                this.isWallHeightSettingSelected ? this._fixedWallsHeight : -1
            )
        );
    }

    /** Re-applies the last map the server sent, then asks for the door and occupied tiles again. */
    // AS3: BCFloorPlanEditor.as::editorWindowProcedure() (the "reload" branch)
    private reload(): void
    {
        if(this._lastReceivedMapEvent !== null)
        {
            this._floorPlanCache.onFloorHeightMap(this._lastReceivedMapEvent);
        }

        this._floorPlanPreviewer?.updatePreview();
        this._heightMapEditor?.refreshFromCache();

        const connection = this._windowManager?.communication?.connection ?? null;

        connection?.send(new GetRoomEntryTileMessageComposer());
        connection?.send(new GetOccupiedTilesMessageComposer());
    }

    /**
     * AS3: BCFloorPlanEditor.as::onKeyboardEvent()
     *
     * Two AS3 oddities kept: both `+` (107) and `-` (109) *increase* the drawing height, and Shift
     * doubles as the colour picker while also being the rectangle-select modifier.
     */
    // AS3: BCFloorPlanEditor.as::onKeyboardEvent()
    onKeyboardEvent(event: KeyboardEvent): void
    {
        if(this._heightMapEditor === null) return;

        if(event.type === 'keydown')
        {
            switch(event.keyCode)
            {
                case 107:
                case 109:
                    this._heightMapEditor.drawingHeight = this._heightMapEditor.drawingHeight + 1;
                    break;
                case 16:
                    this._heightMapEditor.colorPickMode = true;
                    break;
            }

            return;
        }

        if(event.type === 'keyup' && event.keyCode === 16) this._heightMapEditor.colorPickMode = false;
    }

    // AS3: BCFloorPlanEditor.as::setDrawMode()
    private setDrawMode(mode: string): void
    {
        this._drawMode = mode;
    }

    /** Click or drag along the colour ramp to pick the height being painted. */
    // AS3: BCFloorPlanEditor.as::colorMapWindowProcedure()
    private colorMapWindowProcedure = (event: WindowEvent, _window: IWindow): void =>
    {
        if(event.type === 'WME_DOWN')
        {
            this._colorMapMouseDown = true;

            return;
        }

        if(event.type === 'WME_UP' || event.type === 'WME_UP_OUTSIDE')
        {
            this._colorMapMouseDown = false;

            return;
        }

        const isDrag = this._colorMapMouseDown && event.type === 'WME_MOVE';

        if(event.type !== 'WME_CLICK' && !isDrag) return;

        if(!(event instanceof WindowMouseEvent) || this._heightMapEditor === null) return;

        const colorMap = this._editorWindow?.findChildByName('tile_height_colormap') ?? null;

        if(colorMap === null) return;

        const levels = this._heightMapEditor.heigthColorMap.length;
        const height = Math.trunc((event.localX / colorMap.width) * levels);

        this.updateColorSliderTrack(height);
        this._heightMapEditor.drawingHeight = height;
    };

    // AS3: BCFloorPlanEditor.as::updateColorSliderTrack()
    updateColorSliderTrack(height: number): void
    {
        const track = this._editorWindow?.findChildByName('tile_height_slider_track') ?? null;
        const colorMap = this._editorWindow?.findChildByName('tile_height_colormap') ?? null;

        if(track === null || colorMap === null || this._heightMapEditor === null) return;

        track.x = height * (colorMap.width / this._heightMapEditor.heigthColorMap.length);
    }

    // AS3: BCFloorPlanEditor.as::wallHeightSliderProcedure()
    private wallHeightSliderProcedure = (event: WindowEvent, _window: IWindow): void =>
    {
        if(event.type === 'WME_DOWN') this._wallHeightSliderMouseDown = true;
        else if(event.type === 'WME_UP' || event.type === 'WME_UP_OUTSIDE') this._wallHeightSliderMouseDown = false;
        else if(event.type === 'WME_CLICK' || (this._wallHeightSliderMouseDown && event.type === 'WME_MOVE'))
        {
            const slider = this._editorWindow?.findChildByName('wall_height_slider') ?? null;

            if(event instanceof WindowMouseEvent && slider !== null)
            {
                const height = Math.trunc(
                    (event.localX / slider.width) * BCFloorPlanEditor.WALL_HEIGHT_LIMIT
                );

                this.updateWallHeight(height);
                this._fixedWallsHeight = height;
            }
        }

        // AS3 stops propagation unconditionally, including for the events it ignored above.
        event.stopPropagation();
    };

    /** -1 means "no fixed height", which unticks the box rather than moving the slider to 0. */
    // AS3: BCFloorPlanEditor.as::updateWallHeight()
    updateWallHeight(height: number): void
    {
        const checkbox = this._editorWindow
            ?.findChildByName('walls_fixed_height_enabled_checkbox') as unknown as ISelectableWindow | null;

        if(height === -1)
        {
            checkbox?.unselect();
            this.enableWallHeightControls(false);

            return;
        }

        checkbox?.select();
        this.enableWallHeightControls(true);

        const number = this._editorWindow?.findChildByName('wall_height_number') ?? null;
        const slider = this._editorWindow?.findChildByName('wall_height_slider') ?? null;
        const track = this._editorWindow?.findChildByName('wall_height_slider_track') ?? null;

        if(number !== null) number.caption = (height + 1).toString();

        if(slider !== null && track !== null)
        {
            track.x = height * (slider.width / BCFloorPlanEditor.WALL_HEIGHT_LIMIT);
        }
    }

    /** Greys the four wall-height controls together — AS3 sets both enabled state and blend. */
    // AS3: BCFloorPlanEditor.as::enableWallHeightControls()
    private enableWallHeightControls(enabled: boolean): void
    {
        const names = ['wall_height_text', 'wall_height_number', 'wall_height_slider', 'wall_height_slider_track'];

        for(const name of names)
        {
            const window = this._editorWindow?.findChildByName(name) ?? null;

            if(window === null) continue;

            if(enabled) window.enable();
            else window.disable();

            window.blend = enabled ? 1 : 0.6;
        }
    }

    // AS3: BCFloorPlanEditor.as::onFloorHeightMap()
    private onFloorHeightMap = (event: IMessageEvent): void =>
    {
        this._lastReceivedMapEvent = event;
        this._floorPlanCache.onFloorHeightMap(event);
        this._fixedWallsHeight = (event.parser as FloorHeightMapMessageParser | null)?.fixedWallsHeight ?? -1;

        this._floorPlanPreviewer?.updatePreview();
        this._heightMapEditor?.refreshFromCache();

        if(this._editorWindow !== null) this.updateWallHeight(this._fixedWallsHeight);
    };

    /** Ignored until the window exists — the door reply also drives the room itself. */
    // AS3: BCFloorPlanEditor.as::onEntryTileData()
    private onEntryTileData = (event: IMessageEvent): void =>
    {
        if(this._editorWindow === null) return;

        const parser = event.parser as RoomEntryTileMessageParser | null;

        if(parser === null) return;

        this._floorPlanCache.entryPoint = {x: parser.x, y: parser.y};
        this._floorPlanCache.entryPointDir = parser.dir;

        this._heightMapEditor?.refreshFromCache();
        this.updateEntryDirectionAvatar();
    };

    // AS3: BCFloorPlanEditor.as::onOccupiedTiles()
    private onOccupiedTiles = (event: IMessageEvent): void =>
    {
        this._floorPlanCache.onOccupiedTiles(event);
        this._heightMapEditor?.refreshFromCache();
    };

    // AS3: BCFloorPlanEditor.as::onRoomVisualizationSettings()
    private onRoomVisualizationSettings = (event: IMessageEvent): void =>
    {
        const parser = event.parser as RoomVisualizationSettingsEventParser | null;

        if(parser === null) return;

        this._floorThickness = BCFloorPlanEditor.getThicknessSelectionIndex(parser.floorThicknessMultiplier);
        this._wallThickness = BCFloorPlanEditor.getThicknessSelectionIndex(parser.wallThicknessMultiplier);

        this.updateThicknessSelection();
    };

    /** The perk that lifts the plan's area limit. */
    // AS3: BCFloorPlanEditor.as::onPerkAllowances()
    private onPerkAllowances = (event: IMessageEvent): void =>
    {
        const parser = event.parser as PerkAllowancesMessageEventParser | null;

        this._largeFloorPlansAllowed = parser?.isPerkAllowed(PerkType.BUILDER_AT_WORK) ?? false;
    };

    // AS3: BCFloorPlanEditor.as::updatePreviewBitmap()
    updatePreviewBitmap(bitmap: ImageBitmap): void
    {
        const preview = this._editorWindow
            ?.findChildByName('preview_bitmap') as unknown as IBitmapWrapperWindow | null;

        if(preview !== null) preview.bitmap = bitmap;
    }

    /**
     * AS3: BCFloorPlanEditor.as::createTileHeightColorMap()
     *
     * Paints the ramp itself: one 1px column per pixel of the strip, each the colour of the height
     * that position maps to.
     */
    // AS3: BCFloorPlanEditor.as::createTileHeightColorMap()
    private createTileHeightColorMap(colorMap: [number, number, number][]): void
    {
        const strip = this._editorWindow
            ?.findChildByName('tile_height_colormap') as unknown as IBitmapWrapperWindow | null;

        if(strip === null) return;

        const canvas = new OffscreenCanvas(strip.width, strip.height);
        const context = canvas.getContext('2d');

        if(context === null) return;

        for(let x = 0; x < strip.width; x++)
        {
            const level = Math.trunc((x / strip.width) * colorMap.length);
            const rgb = colorMap[level];

            if(rgb === undefined) continue;

            context.fillStyle = `rgb(${Math.trunc(255 * rgb[0])} ${Math.trunc(255 * rgb[1])} ${Math.trunc(255 * rgb[2])})`;
            context.fillRect(x, 0, 1, strip.height);
        }

        strip.bitmap = canvas.transferToImageBitmap();
    }

    /**
     * Turns the little ghost figure with the two arrow buttons.
     *
     * AS3 casts the lookup twice without a null check on either; both are guarded here, because a
     * layout that ships without the widget node would throw on every arrow click instead of just
     * not moving the figure. The figure itself is the widget's own `FIGURE_DEFAULT` — AS3 never
     * sets one here either, and the layout's `<variables>` only carry `avatar_image:scale`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/floorplaneditor/BCFloorPlanEditor.as::updateEntryDirectionAvatar()
    private updateEntryDirectionAvatar(): void
    {
        const host = this._editorWindow?.findChildByName('enterdirection_ghost_avatar') as unknown as IWidgetWindow | null;
        const widget = (host?.widget ?? null) as IAvatarImageWidget | null;

        if(widget === null) return;

        widget.direction = this._floorPlanCache.entryPointDir;
    }

    /** The inverse of `getThicknessSettingBySelectionIndex()`, over the wire's own multipliers. */
    // AS3: BCFloorPlanEditor.as::getThicknessSelectionIndex()
    private static getThicknessSelectionIndex(multiplier: number): number
    {
        switch(multiplier)
        {
            case 0.25: return 0;
            case 0.5: return 1;
            case 2: return 3;
            default: return 2;
        }
    }

    // AS3: BCFloorPlanEditor.as::updateThicknessSelection()
    private updateThicknessSelection(): void
    {
        if(this._editorWindow === null) return;

        const wallDrop = this._editorWindow.findChildByName('wall_thickness_drop') as unknown as IDropMenuWindow | null;
        const floorDrop = this._editorWindow.findChildByName('floor_thickness_drop') as unknown as IDropMenuWindow | null;

        if(wallDrop !== null) wallDrop.selection = this._wallThickness;
        if(floorDrop !== null) floorDrop.selection = this._floorThickness;
    }

    /** Both scrollable views start centred, because the plan is drawn outward from the middle. */
    // AS3: BCFloorPlanEditor.as::centerScrollableViews()
    private centerScrollableViews(): void
    {
        if(this._editorWindow === null) return;

        const heightMapH = this._editorWindow.findChildByName('heightmap_scroll_horizontal') as unknown as IScrollbarWindow | null;
        const heightMapV = this._editorWindow.findChildByName('heightmap_scroll_vertical') as unknown as IScrollbarWindow | null;
        const previewH = this._editorWindow.findChildByName('preview_scroll_horizontal') as unknown as IScrollbarWindow | null;
        const previewV = this._editorWindow.findChildByName('preview_scroll_vertical') as unknown as IScrollbarWindow | null;

        if(heightMapH !== null) heightMapH.scrollH = 0.5;
        if(heightMapV !== null) heightMapV.scrollV = 0.5;
        if(previewH !== null) previewH.scrollH = 0.5;
        if(previewV !== null) previewV.scrollV = 0.5;
    }

    // AS3: BCFloorPlanEditor.as::onRoomDisposed()
    private onRoomDisposed = (): void =>
    {
        this.visible = false;
    };

    // AS3: BCFloorPlanEditor.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    /**
     * Hands `onReady` one of the editor's tile bitmaps, now if it is decoded and later if it is not.
     *
     * AS3 needs nothing like this: `HeightMapEditor` and `FloorPlanPreviewer` each declare their
     * tiles as `[Embed]`ed classes and instantiate them in their own constructors, so the bitmaps
     * exist before either draws. This port ships the same 21 PNGs in the image bundle, but
     * `ResourceManager` holds only a *URL* for each until somebody asks — and both classes were
     * asking through the synchronous `getAsset()`, which reads the decoded cache that nothing had
     * ever filled.
     *
     * That returned null 21 times out of 21, and nothing said so: `getColoredTile()` answered null
     * for every tile, both `updateView()` and `updatePreview()` found an empty placement list and
     * returned *before* assigning a bitmap, and the two panels kept the blank of an untouched
     * `IBitmapWrapperWindow` — the black left panel and white right panel the editor opened with.
     * Every step of it was a legal null.
     *
     * The receiver path loads on first request, so the first open costs one redraw per tile as they
     * land and every open after that takes the synchronous branch.
     */
    // TS-only: AS3 has no counterpart — its tiles are embedded, not fetched.
    requestEmbeddedAsset(name: string, onReady: (bitmap: ImageBitmap) => void): void
    {
        const cached = this._windowManager?.getAsset(name) ?? null;

        if(cached !== null)
        {
            onReady(cached);

            return;
        }

        const resourceManager = this._windowManager?.resourceManager ?? null;

        // Both of these leave `retrieveAsset()` queueing a receiver that is never served, which is
        // the one failure mode this whole path exists to make visible. `hasAsset()` is the probe
        // ResourceManager provides for exactly that question — it answers without queueing anything.
        if(resourceManager === null)
        {
            log.warn(`No resource manager yet — tile "${name}" cannot be requested.`);

            return;
        }

        if(!resourceManager.hasAsset(name))
        {
            log.warn(`Tile "${name}" is in neither the decoded cache nor the URL registry`
                + ' — it does not ship in the images bundle under that name.');

            return;
        }

        resourceManager.retrieveAsset(name, {
            disposed: false,
            dispose: (): void => {},
            receiveAsset: (asset: ImageBitmap): void => onReady(asset),
        });
    }

    // AS3: BCFloorPlanEditor.as::get heightMapBitmapElement()
    get heightMapBitmapElement(): IBitmapWrapperWindow | null
    {
        return this._editorWindow
            ?.findChildByName('heightmap_bitmap') as unknown as IBitmapWrapperWindow | null ?? null;
    }

    // AS3: BCFloorPlanEditor.as::get heightMapMouseCapturer()
    get heightMapMouseCapturer(): IRegionWindow | null
    {
        return this._editorWindow
            ?.findChildByName('mouse_capturer') as unknown as IRegionWindow | null ?? null;
    }

    // AS3: BCFloorPlanEditor.as::get floorPlanCache()
    get floorPlanCache(): FloorPlanCache
    {
        return this._floorPlanCache;
    }

    // AS3: BCFloorPlanEditor.as::get drawModes()
    get drawModes(): string[]
    {
        return this._drawModes;
    }

    // AS3: BCFloorPlanEditor.as::get drawMode()
    get drawMode(): string
    {
        return this._drawMode;
    }

    // AS3: BCFloorPlanEditor.as::get heightMapEditor()
    get heightMapEditor(): HeightMapEditor | null
    {
        return this._heightMapEditor;
    }

    // AS3: BCFloorPlanEditor.as::get largeFloorPlansAllowed()
    get largeFloorPlansAllowed(): boolean
    {
        return this._largeFloorPlansAllowed;
    }

    /** The map exactly as the server last sent it, for Import/Export's Revert. */
    // AS3: BCFloorPlanEditor.as::get lastReceivedFloorPlan()
    get lastReceivedFloorPlan(): string
    {
        if(this._lastReceivedMapEvent === null) return '';

        return (this._lastReceivedMapEvent.parser as FloorHeightMapMessageParser | null)?.text ?? '';
    }

    // AS3: BCFloorPlanEditor.as::get floorThickness()
    get floorThickness(): number
    {
        return this._floorThickness;
    }

    // AS3: BCFloorPlanEditor.as::get wallThickness()
    get wallThickness(): number
    {
        return this._wallThickness;
    }

    // AS3: BCFloorPlanEditor.as::get disposed()
    get disposed(): boolean
    {
        return this._windowManager === null;
    }

    // AS3: BCFloorPlanEditor.as::dispose()
    dispose(): void
    {
        if(this.disposed) return;

        const communication = this._windowManager?.communication ?? null;

        if(this._floorHeightMapMessageEvent !== null && communication !== null)
        {
            communication.removeHabboConnectionMessageEvent(this._floorHeightMapMessageEvent);
            if(this._entryTileDataMessageEvent !== null) communication.removeHabboConnectionMessageEvent(this._entryTileDataMessageEvent);
            if(this._occupiedTilesMessageEvent !== null) communication.removeHabboConnectionMessageEvent(this._occupiedTilesMessageEvent);
            if(this._roomVisualizationSettingsMessageEvent !== null) communication.removeHabboConnectionMessageEvent(this._roomVisualizationSettingsMessageEvent);
            if(this._perkAllowancesMessageEvent !== null) communication.removeHabboConnectionMessageEvent(this._perkAllowancesMessageEvent);

            this._floorHeightMapMessageEvent = null;
            this._entryTileDataMessageEvent = null;
            this._occupiedTilesMessageEvent = null;
            this._roomVisualizationSettingsMessageEvent = null;
        }

        const roomEngine = this._windowManager?.roomEngine ?? null;

        if(roomEngine !== null && !roomEngine.disposed)
        {
            roomEngine.events?.off(RoomEngineEvent.REE_DISPOSED, this.onRoomDisposed);
        }

        this._windowManager?.removeUpdateReceiver(this);
        this._windowManager = null;
    }
}
