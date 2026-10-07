/**
 * RoomWidgetFactory
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetFactory.as
 *
 * Builds what the enabled features declare (RoomWidgetRegistry, J6). Since the core cut
 * (2026-10-07) those are the name bubble (avatar-info), the loading bar (loading-bar) and the
 * object-location answer (room-ui); the git tag `pre-noyau-client` keeps the AS3 rest.
 */
import type {IRoomWidgetFactory} from './IRoomWidgetFactory';
import type {IRoomWidgetHandler} from './IRoomWidgetHandler';
import type {RoomUI} from './RoomUI';
import type {RoomWidgetRegistry} from './RoomWidgetRegistry';

export class RoomWidgetFactory implements IRoomWidgetFactory
{
    // AS3: .../src/com/sulake/habbo/ui/widget/RoomWidgetFactory.as::_roomUI
    private _roomUI: RoomUI;
    private readonly _registry: RoomWidgetRegistry;
    private _disposed: boolean = false;

    constructor(roomUI: RoomUI, registry: RoomWidgetRegistry)
    {
        this._roomUI = roomUI;
        this._registry = registry;
    }

    // DEVIATION: AS3 builds ~40 widget kinds in a switch; here the enabled features declare theirs
    //   (IGameFeature.roomWidgets, J6), and a type none declares answers null (warned once).
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetFactory.as::createWidget()
    public createWidget(type: string, handler: IRoomWidgetHandler): unknown | null
    {
        if(!this._roomUI || !this._roomUI.windowManager) return null;

        return this._registry.get(type)?.widget?.(handler, this._roomUI) ?? null;
    }

    // Derived name: AS3 built the handler in RoomDesktop's own switch (createWidgetHandler, a
    // name of this port); it comes from the same declaration as the widget now.
    public createHandler(type: string): IRoomWidgetHandler | null
    {
        return this._registry.get(type)?.handler() ?? null;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/RoomWidgetFactory.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/RoomWidgetFactory.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._roomUI = null!;
    }
}
