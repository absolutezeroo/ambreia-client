import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IAvatarImageWidget} from '@ambreia/ui/kit/widgets/IAvatarImageWidget';
import type {IHabboLocalizationManager} from '../../localization/IHabboLocalizationManager';

/** What the characters screens share: reading and filling the windows of their layouts. */
export class WindowBits
{
    constructor(private readonly _localization: IHabboLocalizationManager | null) {}

    text(key: string, ...params: string[]): string
    {
        return this._localization?.getLocalizationWithParams(key, key, ...params) ?? key;
    }

    /** A text, or `fallback` when the key has none (a class or role the texts do not name yet). */
    textOr(key: string, fallback: string): string
    {
        const value = this._localization?.getLocalization(key, '') ?? '';

        return value.length > 0 ? value : fallback;
    }

    /** A content id's name (`class.warrior`, `tank`), or the id made readable until the texts have it. */
    contentName(key: string, id: string): string
    {
        const last = id.split('.').pop() ?? id;

        return this.textOr(key, last.charAt(0).toUpperCase() + last.slice(1));
    }

    setText(container: IWindowContainer, name: string, text: string): void
    {
        const window = container.findChildByName(name);

        if(window && window.caption !== text) window.caption = text;
    }

    setVisible(container: IWindowContainer, visible: boolean, ...names: string[]): void
    {
        for(const name of names)
        {
            const window = container.findChildByName(name);

            if(window) window.visible = visible;
        }
    }

    setColor(container: IWindowContainer, name: string, color: number): void
    {
        const window = container.findChildByName(name);

        if(window) window.color = color;
    }

    setTextColor(container: IWindowContainer, name: string, color: number): void
    {
        const window = container.findChildByName(name) as ITextWindow | null;

        if(window && window.textColor !== color) window.textColor = color;
    }

    avatar(container: IWindowContainer, name: string, figure: string, direction = 2, onlyHead = false): void
    {
        const widget = ((container.findChildByName(name) as IWidgetWindow | null)?.widget ?? null) as IAvatarImageWidget | null;

        if(!widget) return;

        widget.onlyHead = onlyHead;
        widget.direction = direction;
        if(widget.figure !== figure) widget.figure = figure;
    }

    /** The window named `name` the event came from, or one of its ancestors: a row, a card, a tile. */
    static ancestor(window: IWindow | null, name: string): IWindow | null
    {
        for(let at = window; at; at = at.parent) if(at.name === name) return at;

        return null;
    }
}
