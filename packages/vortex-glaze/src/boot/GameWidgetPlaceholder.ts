import type {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {IWidget} from '@ambreia/ui/kit/widgets/IWidget';
import type {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';

/**
 * The engine's game widgets (registerHabboWidgets in vortex-engine), which need the avatar
 * renderer, room engine or session Glaze does not have. test/widget-types.test.ts keeps this list
 * in step with the engine.
 */
export const GLAZE_GAME_WIDGET_TYPES: readonly string[] = [
    'avatar_image', 'badge_image', 'furniture_image', 'illumina_chat_bubble', 'pet_image',
    'product_icon', 'product_image', 'room_previewer', 'updating_timestamp'
];

/**
 * Stands in for a game widget: draws nothing, but keeps the widget's own properties (`<type>:<key>`,
 * e.g. `avatar_image:cropped`) so a layout edited and saved in Glaze writes them back unchanged.
 * A bare null here dropped them from the window's properties, and so from the saved XML.
 */
class GameWidgetPlaceholder implements IWidget
{
    private _properties: PropertyStruct[] = [];
    private _disposed: boolean = false;

    constructor(private readonly _prefix: string)
    {
    }

    public get properties(): PropertyStruct[]
    {
        return this._properties;
    }

    public set properties(value: PropertyStruct[])
    {
        this._properties = value.filter(property => property.key.startsWith(this._prefix));
    }

    public get disposed(): boolean
    {
        return this._disposed;
    }

    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._properties = [];
    }
}

export function registerGameWidgetPlaceholders(manager: WindowManager): void
{
    for(const type of GLAZE_GAME_WIDGET_TYPES) manager.widgets.register(type, () => new GameWidgetPlaceholder(`${type}:`));
}
