import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';

/** The size vortex_auth_screen_xml is drawn at. */
const DESIGN = {width: 1280, height: 720};

/**
 * The screen over the whole desktop: the backdrop covers it at its own proportions, the rest keeps
 * its place relative to the centre or to the bottom edge of the 1280 × 720 mock-up.
 */
export function layOutAuthScreen(screen: IWindowContainer, width: number, height: number): void
{
    const at = (name: string): IWindow | null => screen.findChildByName(name);
    const set = (name: string, values: Partial<Pick<IWindow, 'x' | 'y' | 'width' | 'height'>>): void =>
    {
        const window = at(name);

        if(window) Object.assign(window, values);
    };

    Object.assign(screen, {x: 0, y: 0, width, height});
    set('backdrop_color', {x: 0, y: 0, width, height});

    const backdrop = at('backdrop') as (IWindow & {stretchedX: boolean; stretchedY: boolean}) | null;

    if(backdrop)
    {
        const scale = Math.max(width / DESIGN.width, height / DESIGN.height);
        const cover = {width: Math.ceil(DESIGN.width * scale), height: Math.ceil(DESIGN.height * scale)};

        backdrop.stretchedX = backdrop.stretchedY = true;
        Object.assign(backdrop, {...cover, x: Math.round((width - cover.width) / 2), y: Math.round((height - cover.height) / 2)});
    }

    const centreX = (name: string, designY: number): void =>
    {
        const window = at(name);

        if(window) Object.assign(window, {x: Math.round((width - window.width) / 2), y: Math.round(height / 2 + designY - DESIGN.height / 2)});
    };

    centreX('logo', 6);
    centreX('dialog_slot', 235);
    set('footer_bg', {x: 0, y: height - 30, width});
    set('version_txt', {y: height - 23});
}
