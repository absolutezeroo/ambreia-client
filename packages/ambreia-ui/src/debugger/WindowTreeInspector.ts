import type {IWindow} from '../IWindow';
import type {IWindowContainer} from '../IWindowContainer';
import {TYPE_CODE_TO_NAME, WindowType} from '../enum/WindowType';

export interface IWindowDebugRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface IWindowDebugNode {
    window: IWindow;
    name: string;
    caption: string;
    typeName: string;
    type: number;
    style: number;
    state: number;
    param: number;
    rect: IWindowDebugRect;
    globalRect: IWindowDebugRect;
    visible: boolean;
    /**
     * Whether this window narrows the clip for itself and its descendants.
     * WindowComposite only intersects the clip rectangle at a window with this
     * set, so a child drawing outside its parent is cut only when some ancestor
     * has it — without this field there is no way to tell an overhanging skin
     * border from content that is actually being lost.
     */
    // TS-only: mirrors IWindow.clipping for the debugger; no AS3 counterpart.
    clipping: boolean;
    dynamicStyle: string;
    tags: string[];
    /** For static_bitmap windows: the configured asset_uri, if any. */
    assetUri: string | null;
    /** For static_bitmap windows: whether bitmapData has actually loaded (vs still pending/failed). */
    bitmapLoaded: boolean | null;
    /** For static_bitmap windows with a loaded bitmap: its actual pixel dimensions. */
    bitmapSize: {width: number; height: number} | null;
    /** stretchedX/Y, zoomX/Y, pivotPoint, flipX/Y - the exact inputs BitmapDataRenderer scales/positions by. */
    bitmapParams: {
        stretchedX: boolean;
        stretchedY: boolean;
        zoomX: number;
        zoomY: number;
        pivotPoint: number;
        flipX: boolean;
        flipY: boolean;
    } | null;
    /**
     * For text-like windows: the style actually in force, and what the
     * controller measured the text at. A rendered glyph that disagrees with
     * `fontSize` — or an `antiAliasType` that is not the one the layout asked
     * for — is invisible in every other field here, and both decide which of
     * the two text paths draws the window.
     */
    // TS-only: no AS3 counterpart; the visual window debugger reads it to tell a
    // wrongly-styled text window from a wrongly-placed one.
    textStyle: {
        /** The named style in force — the thing that decided the family and size. */
        styleName: string;
        fontFace: string;
        fontSize: number;
        bold: boolean;
        italic: boolean;
        antiAliasType: string;
        autoSize: string;
        leading: number;
        textColor: number;
        textWidth: number;
        textHeight: number;
    } | null;
    children: IWindowDebugNode[];
}

/**
 * Dev-only tooling for the visual window debugger (vortex-engine/src/core/window/debugger).
 * Walks a live IWindow tree through its public IWindow/IWindowContainer API only —
 * no engine internals, no AS3 equivalent.
 */
export class WindowTreeInspector 
{
    public static snapshot(window: IWindow): IWindowDebugNode 
    {
        const globalRect: IWindowDebugRect = {x: 0, y: 0, width: 0, height: 0};

        window.getGlobalRectangle(globalRect);

        const bmp = window as unknown as {
            assetUri?: string;
            bitmapData?: {width: number; height: number} | null;
            stretchedX?: boolean;
            stretchedY?: boolean;
            zoomX?: number;
            zoomY?: number;
            pivotPoint?: number;
            flipX?: boolean;
            flipY?: boolean;
        };
        const hasAssetUri = typeof bmp.assetUri === 'string';
        // A `bitmap` window takes its pixels from code, never from a layout
        // URI, so gating the bitmap fields on `assetUri` reported nothing at
        // all for it — an icon nobody ever filled looked identical to one
        // drawn correctly.
        const isBitmapWindow = hasAssetUri
            || window.type === WindowType.BITMAP_WRAPPER
            || window.type === WindowType.STATIC_BITMAP_WRAPPER;

        const txt = window as unknown as {
            _textStyleName?: string;
            fontFace?: string;
            fontSize?: number;
            bold?: boolean;
            italic?: boolean;
            antiAliasType?: string;
            autoSize?: string;
            leading?: number;
            textColor?: number;
            textWidth?: number;
            textHeight?: number;
        };
        const hasTextStyle = typeof txt.fontFace === 'string' && typeof txt.fontSize === 'number';

        const node: IWindowDebugNode =
            {
                window,
                name: window.name,
                caption: window.caption,
                typeName: TYPE_CODE_TO_NAME[window.type] ?? `unknown(${window.type})`,
                type: window.type,
                style: window.style,
                state: window.state,
                param: window.param,
                rect: {x: window.x, y: window.y, width: window.width, height: window.height},
                globalRect,
                visible: window.visible,
                clipping: window.clipping,
                dynamicStyle: window.dynamicStyle,
                tags: [...window.tags],
                assetUri: hasAssetUri ? (bmp.assetUri as string) : null,
                bitmapLoaded: isBitmapWindow ? (bmp.bitmapData != null) : null,
                bitmapSize: bmp.bitmapData != null
                    ? {width: bmp.bitmapData.width, height: bmp.bitmapData.height}
                    : null,
                bitmapParams: hasAssetUri
                    ? {
                        stretchedX: bmp.stretchedX ?? false,
                        stretchedY: bmp.stretchedY ?? false,
                        zoomX: bmp.zoomX ?? 1,
                        zoomY: bmp.zoomY ?? 1,
                        pivotPoint: bmp.pivotPoint ?? 0,
                        flipX: bmp.flipX ?? false,
                        flipY: bmp.flipY ?? false,
                    }
                    : null,
                textStyle: hasTextStyle
                    ? {
                        styleName: txt._textStyleName ?? '(none)',
                        fontFace: txt.fontFace as string,
                        fontSize: txt.fontSize as number,
                        bold: txt.bold ?? false,
                        italic: txt.italic ?? false,
                        antiAliasType: txt.antiAliasType ?? '(unset)',
                        autoSize: txt.autoSize ?? '(unset)',
                        leading: txt.leading ?? 0,
                        textColor: txt.textColor ?? 0,
                        textWidth: txt.textWidth ?? 0,
                        textHeight: txt.textHeight ?? 0,
                    }
                    : null,
                children: []
            };

        if(WindowTreeInspector.isContainer(window)) 
        {
            for(let i = 0; i < window.numChildren; i++) 
            {
                const child = window.getChildAt(i);

                if(child) 
                {
                    node.children.push(WindowTreeInspector.snapshot(child));
                }
            }
        }

        return node;
    }

    private static isContainer(window: IWindow): window is IWindowContainer 
    {
        return (typeof (window as IWindowContainer).numChildren === 'number')
            && (typeof (window as IWindowContainer).getChildAt === 'function');
    }
}
