import {Logger} from '@ambreia/common/utils/Logger';
import type {IWidgetFactory} from '../IWidgetFactory';
import type {IWidgetWindow} from '../components/IWidgetWindow';
import type {IWindowManager} from './IWindowManager';
import {BalloonWidget} from './widgets/BalloonWidget';
import {CountdownWidget} from './widgets/CountdownWidget';
import {HoverBitmapWidget} from './widgets/HoverBitmapWidget';
import {IlluminaBorderWidget} from './widgets/IlluminaBorderWidget';
import {IlluminaInputWidget} from './widgets/IlluminaInputWidget';
import {LimitedItemGridOverlayWidget} from './widgets/LimitedItemGridOverlayWidget';
import {LimitedItemPreviewOverlayWidget} from './widgets/LimitedItemPreviewOverlayWidget';
import {LimitedItemSupplyLeftOverlayWidget} from './widgets/LimitedItemSupplyLeftOverlayWidget';
import {PixelLimitWidget} from './widgets/PixelLimitWidget';
import {ProgressIndicatorWidget} from './widgets/ProgressIndicatorWidget';
import {RarityItemGridOverlayWidget} from './widgets/RarityItemGridOverlayWidget';
import {RarityItemPreviewOverlayWidget} from './widgets/RarityItemPreviewOverlayWidget';
import {RoomThumbnailWidget} from './widgets/RoomThumbnailWidget';
import {RoomUserCountWidget} from './widgets/RoomUserCountWidget';
import {RunningNumberWidget} from './widgets/RunningNumberWidget';
import {SeparatorWidget} from './widgets/SeparatorWidget';

const log = Logger.getLogger('ui.WidgetRegistry');

/**
 * The `widget` window types: a layout's `widget_type` names one, and the window asks this registry
 * to build it. The kit registers its own; a host adds its game widgets with register().
 *
 * In AS3 a static map in WidgetClasses read by HabboWindowManagerComponent.createWidget().
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/WidgetClasses.as
 */
export class WidgetRegistry implements IWidgetFactory
{
    private readonly _builders = new Map<string, (window: IWidgetWindow) => unknown>();
    private readonly _unknown = new Set<string>();

    public register(type: string, create: (window: IWidgetWindow) => unknown): void
    {
        this._builders.set(type, create);
    }

    /**
     * AS3 throws "Unknown widget type ..."; one unknown type should not abort the whole window's
     * property application, so this warns (once per type) and builds nothing. It never fires on a
     * correctly authored layout: treat it as a missing registration or a typo'd `widget_type`.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::createWidget()
    public createWidget(type: string, window: IWidgetWindow): unknown
    {
        const create = this._builders.get(type);

        if(create) return create(window);

        if(!this._unknown.has(type))
        {
            this._unknown.add(type);
            log.warn(`Unknown widget type "${type}"! You might need to update Glaze to be able to work on this layout.`);
        }

        return null;
    }

    /** Every registered type, sorted: the enumeration of the theme's `widget_type` property. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/WidgetClasses.as::WIDGET_TYPES
    public types(): string[]
    {
        return [...this._builders.keys()].sort();
    }
}

/** The kit's own widgets, which need nothing but the window manager. */
export function registerKitWidgets(registry: WidgetRegistry, manager: IWindowManager): void
{
    registry.register('balloon', w => new BalloonWidget(w, manager));
    registry.register('countdown', w => new CountdownWidget(w, manager));
    registry.register('hover_bitmap', w => new HoverBitmapWidget(w, manager));
    registry.register('illumina_border', w => new IlluminaBorderWidget(w, manager));
    registry.register('illumina_input', w => new IlluminaInputWidget(w, manager));
    registry.register('limited_item_overlay_grid', w => new LimitedItemGridOverlayWidget(w, manager));
    registry.register('limited_item_overlay_preview', w => new LimitedItemPreviewOverlayWidget(w, manager));
    registry.register('limited_item_overlay_supply', w => new LimitedItemSupplyLeftOverlayWidget(w, manager));
    registry.register('pixel_limit', w => new PixelLimitWidget(w, manager));
    registry.register('progress_indicator', w => new ProgressIndicatorWidget(w, manager));
    registry.register('rarity_item_overlay_grid', w => new RarityItemGridOverlayWidget(w, manager));
    registry.register('rarity_item_overlay_preview', w => new RarityItemPreviewOverlayWidget(w, manager));
    registry.register('room_thumbnail', w => new RoomThumbnailWidget(w, manager));
    registry.register('room_user_count', w => new RoomUserCountWidget(w, manager));
    registry.register('running_number', w => new RunningNumberWidget(w, manager));
    registry.register('separator', w => new SeparatorWidget(w, manager));
}
