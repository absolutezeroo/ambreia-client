import type {IWindow} from '@ambreia/ui/IWindow';

/** What the bottom bar's buttons do; the features owning the windows answer `nav`. */
export interface IHudActions
{
    nav(name: string): void;
    /** The « plus » button: its menu, above the button. */
    more(anchor: IWindow): void;
    screenshot(): void;
}
