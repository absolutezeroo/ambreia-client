// AS3 types this field as the concrete HabboWindowManagerComponent, not IWindowManager —
// which is what lets it read `getProperty()` off the Component base. The port had narrowed it to
// the interface, where that accessor is not declared, and the shop link could not be resolved.
import type {HabboWindowManager} from '../HabboWindowManager';
import {HabboWebTools} from '../../utils/HabboWebTools';

/**
 * Link event handler for "habblet/" prefixed URLs.
 *
 * Routes habblet links to appropriate web actions.
 *
 * @see sources/win63_version/habbo/window/handlers/HabbletLinkHandler.as
 */
export class HabbletLinkHandler
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/handlers/HabbletLinkHandler.as::_windowManager
    private _windowManager: HabboWindowManager;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/handlers/HabbletLinkHandler.as::HabbletLinkHandler()
    constructor(windowManager: HabboWindowManager)
    {
        this._windowManager = windowManager;
    }

    // TS-only: explicit disposed flag (AS3 uses _windowManager == null check)
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/handlers/HabbletLinkHandler.as::get disposed()
    public get disposed(): boolean
    {
        return this._windowManager == null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/handlers/HabbletLinkHandler.as::get linkPattern()
    public get linkPattern(): string
    {
        return 'habblet/';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/handlers/HabbletLinkHandler.as::linkReceived()
    public linkReceived(link: string): void
    {
        const parts = link.split('/');

        // AS3: if(_loc2_.length < 2) return
        if(parts.length < 2) return;

        const action = parts[1];

        if(action === 'open')
        {
            // AS3: if(_loc2_.length > 2) _loc3_ = _loc2_[2]
            const target = parts.length > 2 ? parts[2] : null;

            // AS3 only enters this pair when a target was actually given (`_loc2_.length > 2`),
            // so a bare "habblet/open" does nothing — the `target` null check keeps that.
            if(target === 'credits')
            {
                HabboWebTools.openWebPageAndMinimizeClient(this._windowManager?.getProperty('web.shop.relativeUrl') ?? '');
            }
            else if(target)
            {
                HabboWebTools.openWebHabblet(target);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/handlers/HabbletLinkHandler.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._windowManager = null!;
    }
}
