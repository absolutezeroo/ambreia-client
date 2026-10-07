import {Logger} from '@ambreia/common/utils/Logger';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IModalDialog} from './IModalDialog';

const log = Logger.getLogger('habbo.window.utils.ModalDialog');

/**
 * Base modal dialog implementation.
 *
 * Creates a modal overlay that dims the background and presents a
 * centered root window built from an XML layout definition. AS3 captured
 * and darkened the desktop via BitmapData; the TS port captures a Canvas2D
 * snapshot of the desktop layers via WindowComposite (see refresh()) and
 * assigns it as the background window's bitmap.
 *
 * Static members manage a shared modal container across all active
 * modal dialogs, stacking them with alternating background/content
 * child pairs.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as
 */
export class ModalDialog implements IModalDialog
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::MODAL_DIALOG_LAYER
    private static readonly MODAL_DIALOG_LAYER: number = 3;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::_windowManager (static)
    private static _windowManager: IHabboWindowManager | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::_container (static)
    private static _container: IWindowContainer | null = null;
    // Derived name: obfuscated in every tree that carries this class (`_SafeStr_*`
    // in the primary, `var_*` in the secondary), so no tree recovers it.
    // AS3: sources/win63_version/habbo/window/utils/ModalDialog.as::_refreshPending (static)
    private static _refreshPending: number = 0;
    // TS-only: replaces AS3 var_360: Stage null-check init guard
    private static _initialized: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::ModalDialog()
    constructor(windowManager: IHabboWindowManager, xml: string)
    {
        ModalDialog.initialiseStaticMembers(windowManager);

        // AS3: create("","",21,0,1,new Rectangle(0,0,1,1),null,_container,0)
        this._background = ModalDialog._windowManager!.createWindow(
            'modal_bg', '', 21, 0, 1,
            {x: 0, y: 0, width: 1, height: 1},
            null, 0, ModalDialog.MODAL_DIALOG_LAYER
        );

        if(ModalDialog._container && this._background)
        {
            ModalDialog._container.addChild(this._background);
        }

        // Build the root window from XML layout
        this._rootWindow = ModalDialog._windowManager!.buildFromXML(xml, ModalDialog.MODAL_DIALOG_LAYER);

        if(ModalDialog._container && this._rootWindow)
        {
            ModalDialog._container.addChild(this._rootWindow);
            this._rootWindow.center();
            ModalDialog._container.visible = true;
        }

        ModalDialog.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // Derived name: `_rootWindow` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/utils/ModalDialog.as::_rootWindow
    private _rootWindow: IWindow | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::get rootWindow()
    public get rootWindow(): IWindow | null
    {
        return this._rootWindow;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::_background
    private _background: IWindow | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::get background()
    public get background(): IWindow | null
    {
        return this._background;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::onResize()
    public static onResize(): void
    {
        if(!ModalDialog._container || ModalDialog._container.numChildren <= 0) return;

        ModalDialog._refreshPending = 2;

        const lastChild = ModalDialog._container.getChildAt(ModalDialog._container.numChildren - 1);

        if(lastChild)
        {
            lastChild.center();
        }
    }

    // Derived name: `onUpdate` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/utils/ModalDialog.as::onUpdate()
    public static onUpdate(): void
    {
        if(!ModalDialog._container || ModalDialog._container.numChildren <= 0) return;

        if(ModalDialog._refreshPending > 0)
        {
            ModalDialog._refreshPending--;

            if(ModalDialog._refreshPending === 0)
            {
                ModalDialog.refresh();
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::initialiseStaticMembers()
    private static initialiseStaticMembers(windowManager: IHabboWindowManager): void
    {
        if(ModalDialog._initialized) return;

        ModalDialog._windowManager = windowManager;
        ModalDialog._initialized = true;

        // Create the shared modal container in the modal layer
        ModalDialog._container = ModalDialog._windowManager.createWindow(
            'modal_container', '', 4, 0, 0,
            {x: 0, y: 0, width: 1, height: 1},
            null, 0, ModalDialog.MODAL_DIALOG_LAYER
        ) as IWindowContainer;

        log.debug('Modal dialog static members initialized');
    }

    /**
	 * Rebuilds the stacked background/content pairs in the shared modal
	 * container: captures the real desktop (layers below the modal layer) as
	 * a snapshot, darkens it, and layers in each stacked dialog's own frozen
	 * appearance so only the topmost pair stays live/visible.
	 *
	 * AS3 captured this via `BitmapData.draw(stage)`, relying on Flash
	 * ignoring a DisplayObject's own `visible` flag when drawing it — this
	 * port's compositor has no such quirk (it skips invisible desktops), so
	 * the snapshot is taken before the desktops are hidden instead.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::refresh()
    private static refresh(): void
    {
        if(!ModalDialog._container) return;

        const isEmpty = ModalDialog._container.numChildren === 0;

        if(isEmpty)
        {
            // No dialogs open: show underlying desktop layers and force them
            // to repaint (AS3: `for each(_loc9_ in _loc2_.iterator) _loc9_.invalidate();`)
            for(let i = 0; i < ModalDialog.MODAL_DIALOG_LAYER; i++)
            {
                const desktop = ModalDialog._windowManager!.getDesktop(i);

                if(!desktop) continue;

                desktop.visible = true;

                const container = desktop as unknown as IWindowContainer;

                for(let j = 0; j < container.numChildren; j++)
                {
                    container.getChildAt(j)?.invalidate();
                }
            }

            return;
        }

        const desktop0 = ModalDialog._windowManager!.getDesktop(0);
        const stageWidth = Math.max(1, desktop0?.width ?? 1);
        const stageHeight = Math.max(1, desktop0?.height ?? 1);

        ModalDialog._container.width = stageWidth;
        ModalDialog._container.height = stageHeight;

        const numChildren = ModalDialog._container.numChildren;

        // Reset pass: clear stale background bitmaps, re-center content windows.
        for(let i = 0; i < numChildren; i++)
        {
            const child = ModalDialog._container.getChildAt(i);

            if(!child) continue;

            if(i % 2 === 0)
            {
                child.width = stageWidth;
                child.height = stageHeight;
                (child as unknown as IBitmapWrapperWindow).bitmap = null;
            }
            else
            {
                child.center();
            }
        }

        // Capture the real desktop layers while still visible, then hide them.
        const rawSnapshot = ModalDialog._windowManager!.compositeLayers(
            ModalDialog.MODAL_DIALOG_LAYER, stageWidth, stageHeight
        );

        for(let i = 0; i < ModalDialog.MODAL_DIALOG_LAYER; i++)
        {
            const desktop = ModalDialog._windowManager!.getDesktop(i);

            if(desktop) desktop.visible = false;
        }

        if(!rawSnapshot) return;

        const darkened = ModalDialog._windowManager!.darkenSnapshot(rawSnapshot, stageWidth, stageHeight);

        if(!darkened) return;

        // Owned canvas (not the renderer's shared buffer) — safe to detach.
        let currentBitmap: ImageBitmap = darkened.transferToImageBitmap();

        // Assign pass: bake the accumulated snapshot into each background slot,
        // freezing each earlier stacked dialog's own rendered look into the
        // next background as newer dialogs stack on top of it. This must run
        // to completion (reading each prior dialog's still-`visible` render)
        // BEFORE the visibility pass below hides it — renderWindowSnapshot()
        // skips invisible windows, unlike AS3's getGraphicContext(), which
        // stays valid regardless of the window's current `visible` flag.
        for(let i = 0; i < numChildren; i += 2)
        {
            const child = ModalDialog._container.getChildAt(i);

            if(!child) continue;

            if(i >= 2)
            {
                const prevDialog = ModalDialog._container.getChildAt(i - 1);
                const cloneCanvas = new OffscreenCanvas(stageWidth, stageHeight);
                const cctx = cloneCanvas.getContext('2d');

                if(cctx)
                {
                    cctx.imageSmoothingEnabled = false;
                    cctx.drawImage(currentBitmap, 0, 0);

                    if(prevDialog)
                    {
                        const prevSnapshot = ModalDialog._windowManager!.renderWindowSnapshot(
                            prevDialog, stageWidth, stageHeight, true
                        );

                        if(prevSnapshot) cctx.drawImage(prevSnapshot, 0, 0);
                    }
                }

                currentBitmap = cloneCanvas.transferToImageBitmap();
            }

            (child as unknown as IBitmapWrapperWindow).bitmap = currentBitmap;
        }

        // Visibility pass: only the topmost pair (last two children) stays visible.
        for(let i = 0; i < numChildren; i++)
        {
            const child = ModalDialog._container.getChildAt(i);

            if(!child) continue;

            child.visible = (i >= numChildren - 2);
            child.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        if(this._background)
        {
            this._background.dispose();
            this._background = null;
        }

        if(this._rootWindow)
        {
            this._rootWindow.dispose();
            this._rootWindow = null;
        }

        ModalDialog.refresh();

        if(ModalDialog._container && ModalDialog._container.numChildren === 0)
        {
            ModalDialog._container.visible = false;
        }

        this._disposed = true;
    }
}
