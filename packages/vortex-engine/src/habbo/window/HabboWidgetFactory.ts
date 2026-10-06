import type {IWidgetFactory} from '@core/window/IWidgetFactory';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IHabboWindowManager} from './IHabboWindowManager';
import {Logger} from '@core/utils/Logger';
import {AvatarImageWidget} from './widgets/AvatarImageWidget';
import {BadgeImageWidget} from './widgets/BadgeImageWidget';
import {BalloonWidget} from './widgets/BalloonWidget';
import {CountdownWidget} from './widgets/CountdownWidget';
import {FurnitureImageWidget} from './widgets/FurnitureImageWidget';
import {HoverBitmapWidget} from './widgets/HoverBitmapWidget';
import {IlluminaBorderWidget} from './widgets/IlluminaBorderWidget';
import {IlluminaChatBubbleWidget} from './widgets/IlluminaChatBubbleWidget';
import {IlluminaInputWidget} from './widgets/IlluminaInputWidget';
import {LimitedItemGridOverlayWidget} from './widgets/LimitedItemGridOverlayWidget';
import {LimitedItemPreviewOverlayWidget} from './widgets/LimitedItemPreviewOverlayWidget';
import {LimitedItemSupplyLeftOverlayWidget} from './widgets/LimitedItemSupplyLeftOverlayWidget';
import {PetImageWidget} from './widgets/PetImageWidget';
import {PixelLimitWidget} from './widgets/PixelLimitWidget';
import {ProductIconWidget} from './widgets/ProductIconWidget';
import {ProductImageWidget} from './widgets/ProductImageWidget';
import {ProgressIndicatorWidget} from './widgets/ProgressIndicatorWidget';
import {RarityItemGridOverlayWidget} from './widgets/RarityItemGridOverlayWidget';
import {RarityItemPreviewOverlayWidget} from './widgets/RarityItemPreviewOverlayWidget';
import {RoomPreviewerWidget} from './widgets/RoomPreviewerWidget';
import {RoomThumbnailWidget} from './widgets/RoomThumbnailWidget';
import {RoomUserCountWidget} from './widgets/RoomUserCountWidget';
import {RunningNumberWidget} from './widgets/RunningNumberWidget';
import {SeparatorWidget} from './widgets/SeparatorWidget';
import {UpdatingTimeStampWidget} from './widgets/UpdatingTimeStampWidget';

const log = Logger.getLogger('habbo.window.HabboWidgetFactory');

/**
 * Widget constructor signature.
 *
 * All widgets receive their host IWidgetWindow and the window manager.
 */
type WidgetConstructor = new (window: IWidgetWindow, windowManager: IHabboWindowManager) => unknown;

/**
 * Habbo widget factory.
 *
 * Maintains a registry of widget type strings to widget constructors.
 * When WidgetWindowController sets `widget_type`, it calls createWidget()
 * which instantiates the appropriate widget class.
 *
 * Port of AS3 WidgetClasses (widget registry) + HabboWindowManagerComponent.createWidget().
 *
 * Every case is built. The wall/floor-item ones go through
 * IRoomEngine.getWallItemImage()/getFurnitureImage(); the pixel-effect one goes through
 * `window/utils/EffectPreviewer`, which puts an avatar wearing the effect into the widget's own
 * room previewer.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/WidgetClasses.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::createWidget()
 */
export class HabboWidgetFactory implements IWidgetFactory
{
    private static readonly WIDGET_REGISTRY: Map<string, WidgetConstructor> = HabboWidgetFactory.buildRegistry();

    /**
	 * Every registered widget type name, sorted — the enumeration `ThemeManager` offers for the
	 * `widget_type` window property.
	 *
	 * AS3 derives it from the registry in the same class body (`for(key in _SafeStr_4661)` then
	 * `.sort()`); deriving it here too is what stops the two lists drifting, which they already had
	 * once. (The fork dropped `chest_overlay_grid` with the wired chests.)
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/WidgetClasses.as::WIDGET_TYPES
    public static readonly WIDGET_TYPES: readonly string[] =
        [...HabboWidgetFactory.WIDGET_REGISTRY.keys()].sort();

    private _windowManager: IHabboWindowManager;

    constructor(windowManager: IHabboWindowManager)
    {
        this._windowManager = windowManager;
    }

    /**
	 * Build the widget type registry.
	 *
	 * Maps widget type strings to their constructor classes.
	 * This is the TypeScript equivalent of AS3 WidgetClasses._SafeStr_4661.
	 */
    private static buildRegistry(): Map<string, WidgetConstructor>
    {
        const registry = new Map<string, WidgetConstructor>();

        registry.set('avatar_image', AvatarImageWidget);
        registry.set('badge_image', BadgeImageWidget);
        registry.set('balloon', BalloonWidget);
        registry.set('countdown', CountdownWidget);
        registry.set('furniture_image', FurnitureImageWidget);
        registry.set('hover_bitmap', HoverBitmapWidget);
        registry.set('illumina_border', IlluminaBorderWidget);
        registry.set('illumina_chat_bubble', IlluminaChatBubbleWidget);
        registry.set('illumina_input', IlluminaInputWidget);
        registry.set('limited_item_overlay_grid', LimitedItemGridOverlayWidget);
        registry.set('limited_item_overlay_preview', LimitedItemPreviewOverlayWidget);
        registry.set('limited_item_overlay_supply', LimitedItemSupplyLeftOverlayWidget);
        registry.set('pet_image', PetImageWidget);
        registry.set('pixel_limit', PixelLimitWidget);
        registry.set('product_icon', ProductIconWidget);
        registry.set('product_image', ProductImageWidget);
        registry.set('progress_indicator', ProgressIndicatorWidget);
        registry.set('rarity_item_overlay_grid', RarityItemGridOverlayWidget);
        registry.set('rarity_item_overlay_preview', RarityItemPreviewOverlayWidget);
        registry.set('room_previewer', RoomPreviewerWidget);
        registry.set('room_thumbnail', RoomThumbnailWidget);
        registry.set('room_user_count', RoomUserCountWidget);
        registry.set('running_number', RunningNumberWidget);
        registry.set('separator', SeparatorWidget);
        registry.set('updating_timestamp', UpdatingTimeStampWidget);

        return registry;
    }

    /**
	 * Create a widget by type identifier.
	 *
	 * @param type - The widget type string (e.g. "avatar_image", "badge_image")
	 * @param window - The host IWidgetWindow
	 * @returns The created widget, or null if the type is unknown
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::createWidget()
	 * throws "Unknown widget type ..." when the type isn't registered. We log instead of
	 * throwing - one unknown widget type shouldn't abort the whole window's property
	 * application - but this should never fire against correctly-authored layouts, so
	 * treat any occurrence as a real bug (missing registration or a typo'd widget_type).
	 */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::createWidget()
    public createWidget(type: string, window: IWidgetWindow): unknown
    {
        const widgetClass = HabboWidgetFactory.WIDGET_REGISTRY.get(type);

        if(!widgetClass)
        {
            log.warn(`Unknown widget type "${type}"! You might need to update Glaze to be able to work on this layout.`);

            return null;
        }

        return new widgetClass(window, this._windowManager);
    }
}
