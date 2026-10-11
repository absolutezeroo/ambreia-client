import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IBitmapWrapperWindow} from '@ambreia/ui/components/IBitmapWrapperWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IFigurePart} from '@ambreia/avatar/structure/figure/IFigurePart';
import {AvatarTextureUtils} from '../AvatarTextureUtils';
import type {IFigurePartSet} from '@ambreia/avatar/structure/figure/IFigurePartSet';
import type {IPartColor} from '@ambreia/avatar/structure/figure/IPartColor';
import type {IAvatarEditorGridPartItem} from './IAvatarEditorGridItem';
import type {IAvatarEditorGridModel} from './IAvatarEditorGridModel';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';

/** TS-only: the rectangle union `analyzePartLayers()` accumulates. */
/**
 * What `getSprite()` hands back: the pieces of AS3's `BitmapDataAsset` this class actually reads.
 *
 * TS-only: the port resolves sprites to `IGraphicAsset`, whose texture and offsets are shaped
 * differently — see `getSprite()`.
 */
interface IThumbSprite
{
    // TS-only: AS3 reads `BitmapDataAsset.content`, a BitmapData.
    content: ImageBitmap;

    // TS-only: AS3 reads `BitmapDataAsset.offset`, the negated draw origin.
    offset: {x: number; y: number};

    // TS-only: AS3 reads `BitmapDataAsset.rectangle`.
    rectangle: {width: number; height: number};
}

interface IThumbRect
{
    // TS-only: `flash.geom.Rectangle.x`.
    x: number;

    // TS-only: `flash.geom.Rectangle.y`.
    y: number;

    // TS-only: `flash.geom.Rectangle.width`.
    width: number;

    // TS-only: `flash.geom.Rectangle.height`.
    height: number;
}

/**
 * One clothing thumbnail, **composited from the avatar renderer's own sprites** rather than drawn
 * from a pre-made icon.
 *
 * That is the whole of this class: find each of the part set's sprites, work out the bounding box
 * they occupy, then draw them in avatar draw order with the user's chosen colours applied to the
 * dyeable layers. If the sprites are not downloaded yet it shows a download icon and asks the
 * renderer to fetch them, redrawing when `avatarImageReady()` fires.
 *
 * The synthetic "remove item" and "get more" tiles have no part set; they are given a 1×1
 * placeholder and painted from `iconImage` instead.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/AvatarEditorGridPartItem.as
 */
export class AvatarEditorGridPartItem implements IAvatarEditorGridPartItem, IAvatarImageListener
{
    /**
     * Back to front, so a coat covers the shirt and hair covers the head. Note it is **not** the
     * same as `AvatarFigurePartType`'s declaration order, and it contains layer types the editor
     * never edits (`bd`, `fc`, `ey`, the left/right hand and sleeve parts) — a part set expands
     * into those, so the sort has to know about them.
     */
    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::DRAW_ORDER
    private static readonly DRAW_ORDER: readonly string[] = [
        'li', 'lh', 'ls', 'lc', 'mcl', 'ptl', 'bd', 'sh', 'lg', 'ch', 'ca', 'cc', 'cp', 'mc', 'pt',
        'wa', 'rh', 'rs', 'rc', 'mcr', 'ptr', 'hd', 'fc', 'ey', 'hr', 'hrb', 'fa', 'ea', 'ha', 'he', 'ri'
    ];

    /**
     * The directions to try, in preference order — 2 (facing right-ish) first, then round the
     * compass. A part is drawn in the **first** direction any of its sprites exists in, and every
     * later part then reuses that same direction, so the whole thumbnail is coherent.
     *
     * An *instance* constant in AS3, assigned in the constructor before `super()`.
     */
    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::THUMB_DIRECTIONS
    private static readonly THUMB_DIRECTIONS: readonly number[] = [2, 6, 0, 4, 3, 1];

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::SPRITE_ACTION
    // Name DERIVED: the "h_std_" prefix and trailing "_0" frame AS3 builds inline.
    private static readonly SPRITE_PREFIX: string = 'h_std_';

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::SPRITE_FRAME
    private static readonly SPRITE_FRAME: string = '0';

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::DOWNLOAD_ICON_ASSET
    // Name DERIVED: the asset shown while the sprites are still being fetched.
    private static readonly DOWNLOAD_ICON_ASSET: string = 'avatar_editor_avatar_editor_download_icon';

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::DISABLED_ALPHA
    // Name DERIVED: the alpha used for a disabled appearance item.
    private static readonly DISABLED_ALPHA: number = 0.2;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::HOVER_BLEND
    // Name DERIVED: the 0.5 the selection background is drawn at while hovered but unselected.
    private static readonly HOVER_BLEND: number = 0.5;

    /**
     * Static, and **nulled by every instance's `dispose()`** — so disposing one thumbnail forces
     * the next one that needs it to re-fetch. Kept.
     */
    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_downloadIcon
    private static _downloadIcon: ImageBitmap | null = null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_model
    // Name DERIVED (`_SafeStr_4570`).
    private _model: IAvatarEditorGridModel | null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_window
    private _window: IWindowContainer | null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_selectionBackground
    // Name DERIVED (`_SafeStr_5584`): found by the **tag** "BG_COLOR".
    private _selectionBackground: IWindow | null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_partSet
    // Name DERIVED (`_SafeStr_5841`). Null for the two synthetic tiles.
    private _partSet: IFigurePartSet | null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_colors
    private _colors: (IPartColor | null)[] | null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_useColors
    private _useColors: boolean;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_isSelected
    // Name DERIVED (`_SafeStr_7496`).
    private _isSelected: boolean = false;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_iconImage
    // Name DERIVED (`_SafeStr_5528`): the composited thumbnail, or the caller-supplied icon for a
    // synthetic tile.
    private _iconImage: ImageBitmap | null = null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_thumbRect
    // Name DERIVED (`_SafeStr_5235`): the union of every sprite's bounds, computed once.
    private _thumbRect: IThumbRect | null = null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_colorLayerCount
    // Name DERIVED (`_SafeStr_8703`): the highest colour-layer index across the part's sprites.
    private _colorLayerCount: number = 0;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_renderManager
    // Name DERIVED (`_SafeStr_5322`).
    private _renderManager: IAvatarRenderManager | null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_disposed
    // Name DERIVED (`_SafeStr_5769`).
    private _disposed: boolean = false;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::_isDisabledForWearing
    private _isDisabledForWearing: boolean;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::AvatarEditorGridPartItem()
    constructor(
        window: IWindowContainer | null,
        model: IAvatarEditorGridModel | null,
        partSet: IFigurePartSet | null,
        colors: (IPartColor | null)[] | null,
        useColors: boolean = true,
        isDisabledForWearing: boolean = false
    )
    {
        this._model = model;
        this._partSet = partSet;
        this._window = window;
        this._selectionBackground = window?.findChildByTag('BG_COLOR') ?? null;
        this._colors = colors;
        this._useColors = useColors;
        this._isDisabledForWearing = isDisabledForWearing;

        // A synthetic tile gets a 1×1 placeholder so `updateThumbVisualization()` has something to
        // blit before `iconImage` is assigned.
        if(partSet === null) this._iconImage = null;

        if(partSet !== null)
        {
            for(const part of partSet.parts ?? [])
            {
                this._colorLayerCount = Math.max(this._colorLayerCount, part.colorLayerIndex);
            }
        }

        this._renderManager = this.resolveRenderManager();

        window?.addEventListener(WindowMouseEvent.OVER, this.onMouseOver);
        window?.addEventListener(WindowMouseEvent.OUT, this.onMouseOut);

        this.updateThumbVisualization();
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get view()
    public get view(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get partSet()
    public get partSet(): IFigurePartSet | null
    {
        return this._partSet;
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get colorLayerCount()
    public get colorLayerCount(): number
    {
        return this._colorLayerCount;
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get isDisabledForWearing()
    public get isDisabledForWearing(): boolean
    {
        return this._isDisabledForWearing;
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get id()
    // −1 for a synthetic tile, which is what makes `CategoryData.selectPartId(-1)` land on it.
    public get id(): number
    {
        return this._partSet?.id ?? -1;
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get isSelected()
    public get isSelected(): boolean
    {
        return this._isSelected;
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::set isSelected()
    public set isSelected(value: boolean)
    {
        this._isSelected = value;

        this.updateThumbVisualization();
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::set iconImage()
    // Write-only in AS3; the getter does not exist. `IAvatarEditorGridPartItem` declares it as a
    // property, so a getter is provided for the interface's sake.
    public get iconImage(): ImageBitmap | null
    {
        return this._iconImage;
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::set iconImage()
    public set iconImage(value: ImageBitmap | null)
    {
        this._iconImage = value;

        this.updateThumbVisualization();
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::set colors()
    // Also write-only in AS3 — every repaint of the grid comes through here.
    public get colors(): (IPartColor | null)[]
    {
        return this._colors ?? [];
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::set colors()
    public set colors(value: (IPartColor | null)[])
    {
        this._colors = value;

        this.updateThumbVisualization();
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::update()
    public update(): void
    {
        this.updateThumbVisualization();
    }

    /**
     * The sprites finished downloading. AS3 does not implement this method at all despite
     * declaring `_SafeCls_67` — so a thumbnail that showed the download icon **never repaints**
     * until something else touches it.
     *
     * Kept as a repaint here rather than left empty. The empty version is almost
     * certainly a decompilation loss (the class implements the listener interface *solely* to be
     * passed to `downloadFigure`, which has no other purpose), and leaving it empty would mean
     * every not-yet-downloaded item stays a download icon for the life of the grid. If the empty
     * body turns out to be deliberate, this is the one line to revert.
     */
    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::avatarImageReady()
    public avatarImageReady(_figureString: string): void
    {
        this._thumbRect = null;

        this.updateThumbVisualization();
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::dispose()
    // Nulls the **static** download icon, so the next thumbnail re-fetches it — see `_downloadIcon`.
    public dispose(): void
    {
        if(this._disposed) return;

        this._model = null;
        this._partSet = null;

        if(this._window !== null && !this._window.disposed) this._window.dispose();

        this._window = null;
        this._iconImage = null;
        this._disposed = true;
        AvatarEditorGridPartItem._downloadIcon = null;
        this._selectionBackground = null;
        this._thumbRect = null;
        this._renderManager = null;
        this._colors = null;
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::onMouseOver()
    // A selected tile ignores hover entirely — its background is already fully lit.
    private onMouseOver = (): void =>
    {
        if(this._isSelected || this._selectionBackground === null) return;

        this._selectionBackground.visible = true;
        this._selectionBackground.blend = AvatarEditorGridPartItem.HOVER_BLEND;
    };

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::onMousetOut()
    // The AS3 method name has a typo ("Mouset"); the port spells it correctly since nothing
    // depends on the identifier.
    private onMouseOut = (): void =>
    {
        if(this._selectionBackground === null) return;

        if(!this._isSelected) this._selectionBackground.visible = false;

        this._selectionBackground.blend = 1;
    };

    /**
     * Paints the thumbnail centred in its window, then the sellable badge and selection state.
     *
     * `iconImage` wins over the composite **only when `useColors` is false** — which is how the
     * synthetic tiles and the rendered face thumbnails (`BodyModel`) get through, since both are
     * built with `colourable` false.
     */
    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::updateThumbVisualization()
    private updateThumbVisualization(): void
    {
        if(this._window === null || this._window.disposed) return;

        const target = this._window.findChildByName('bitmap') as IBitmapWrapperWindow | null;

        if(target !== null && target !== undefined)
        {
            const source = this._iconImage !== null && !this._useColors
                ? this._iconImage
                : this.renderThumb();

            if(source === null) return;

            target.bitmap = this.centre(source, target.width, target.height);
        }

        const legacyAccessIcon = this._window.findChildByTag('CLUB_ICON');
        const sellableIcon = this._window.findChildByTag('SELLABLE_ICON') as IStaticBitmapWrapperWindow | null;

        if(legacyAccessIcon !== null) legacyAccessIcon.visible = false;
        if(sellableIcon !== null && sellableIcon !== undefined) sellableIcon.visible = this._partSet?.isSellable ?? false;

        if(this._selectionBackground === null) return;

        this._selectionBackground.visible = this._isSelected;
        this._selectionBackground.blend = 1;
        this._window.invalidate();
    }

    /**
     * the disabled alpha to *that* buffer. Composed on an OffscreenCanvas here, which is the same
     * operation and lets the alpha be a `globalAlpha` rather than a pixel pass.
     */
    // TS-only: the OffscreenCanvas form of AS3's window-sized copyPixels + alpha pass.
    private centre(source: ImageBitmap, width: number, height: number): ImageBitmap | null
    {
        if(width <= 0 || height <= 0) return null;

        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');

        if(context === null) return null;

        if(this._isDisabledForWearing) context.globalAlpha = AvatarEditorGridPartItem.DISABLED_ALPHA;

        context.drawImage(
            source,
            Math.trunc((width - source.width) / 2),
            Math.trunc((height - source.height) / 2)
        );

        return canvas.transferToImageBitmap();
    }

    /**
     * Composites the part's sprites in draw order, tinting each dyeable layer with the colour
     * selected for its layer index. Returns the download icon while the sprites are still being
     * fetched.
     *
     * Note the colour lookup is `_colors[colorLayerIndex - 1]` — the indexes are **1-based** on
     * the sprite and 0-based in the array, and a layer index of 0 means "not dyeable".
     */
    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::renderThumb()
    private renderThumb(): ImageBitmap | null
    {
        if(this._partSet === null || this._model === null) return null;

        if(this._thumbRect === null && !this.analyzePartLayers()) return this.getDownloadIcon();

        const rect = this._thumbRect;

        if(rect === null || this._renderManager === null) return null;
        if(rect.width <= 0 || rect.height <= 0) return null;

        const canvas = new OffscreenCanvas(rect.width, rect.height);
        const context = canvas.getContext('2d');

        if(context === null) return null;

        let direction = 0;
        let directionFound = false;
        const parts = [...(this._partSet.parts ?? [])].sort(AvatarEditorGridPartItem.sortByDrawOrder);

        for(const part of parts)
        {
            let asset: IThumbSprite | null = null;

            if(directionFound)
            {
                asset = this.getSprite(part, AvatarEditorGridPartItem.THUMB_DIRECTIONS[direction]);
            }
            else
            {
                direction = 0;

                while(!directionFound && direction < AvatarEditorGridPartItem.THUMB_DIRECTIONS.length)
                {
                    asset = this.getSprite(part, AvatarEditorGridPartItem.THUMB_DIRECTIONS[direction]);

                    if(asset?.content != null) directionFound = true;
                    else direction++;
                }
            }

            const bitmap = (asset?.content ?? null) as ImageBitmap | null;

            if(asset === null || bitmap === null) continue;

            const x = -asset.offset.x - rect.x;
            const y = -asset.offset.y - rect.y;
            const colour = this._useColors && part.colorLayerIndex > 0
                ? this._colors?.[part.colorLayerIndex - 1] ?? null
                : null;

            if(colour === null)
            {
                context.globalCompositeOperation = 'source-over';
                context.drawImage(bitmap, x, y);

                continue;
            }

            // AS3 applies the colour as a draw-time ColorTransform. Composed the same way as
            // `AvatarEditorGridColorItem.setupColor()`: multiply, then mask back to the sprite's
            // own alpha so the transparent margin is not tinted.
            const tinted = this.tint(bitmap, colour);

            if(tinted !== null) context.drawImage(tinted, x, y);
        }

        return canvas.transferToImageBitmap();
    }

    // TS-only: the per-sprite multiply, extracted from `renderThumb()`'s inner loop.
    private tint(bitmap: ImageBitmap, colour: IPartColor): ImageBitmap | null
    {
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext('2d');

        if(context === null) return null;

        const {redMultiplier, greenMultiplier, blueMultiplier} = colour.colorTransform;

        context.drawImage(bitmap, 0, 0);
        context.globalCompositeOperation = 'multiply';
        context.fillStyle = `rgb(${Math.round(redMultiplier * 255)}, `
            + `${Math.round(greenMultiplier * 255)}, ${Math.round(blueMultiplier * 255)})`;
        context.fillRect(0, 0, bitmap.width, bitmap.height);
        context.globalCompositeOperation = 'destination-in';
        context.drawImage(bitmap, 0, 0);

        return canvas.transferToImageBitmap();
    }

    /**
     * Works out the bounding box the part's sprites occupy, so the composite is cropped to the
     * clothing rather than to a whole avatar. Returns false — and kicks off a download — when the
     * figure's assets are not in yet.
     */
    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::analyzePartLayers()
    private analyzePartLayers(): boolean
    {
        if(this._model === null || this._renderManager === null)
        {
            this._thumbRect = null;

            return false;
        }

        const parts = this._partSet?.parts ?? [];

        if(parts.length === 0)
        {
            this._thumbRect = null;

            return false;
        }

        const container = this._renderManager.createFigureContainer(`${this._partSet?.type}-${this._partSet?.id}`);

        if(!this._renderManager.isFigureReady(container))
        {
            this._renderManager.downloadFigure(container, this);

            return false;
        }

        let direction = 0;
        let directionFound = false;
        let union: IThumbRect | null = null;

        for(const part of parts)
        {
            let asset: IThumbSprite | null = null;

            if(directionFound)
            {
                asset = this.getSprite(part, AvatarEditorGridPartItem.THUMB_DIRECTIONS[direction]);
            }
            else
            {
                direction = 0;

                while(!directionFound && direction < AvatarEditorGridPartItem.THUMB_DIRECTIONS.length)
                {
                    asset = this.getSprite(part, AvatarEditorGridPartItem.THUMB_DIRECTIONS[direction]);

                    if(asset?.content != null) directionFound = true;
                    else direction++;
                }
            }

            if(asset?.content == null) continue;

            union = AvatarEditorGridPartItem.unionRect(union, {
                x: -asset.offset.x,
                y: -asset.offset.y,
                width: asset.rectangle?.width ?? 0,
                height: asset.rectangle?.height ?? 0
            });
        }

        if(union !== null && union.width > 0)
        {
            this._thumbRect = union;

            return true;
        }

        return false;
    }

    // TS-only: AS3 builds the sprite name inline in both loops, identically.
    private getSprite(part: IFigurePart, direction: number): IThumbSprite | null
    {
        const name = `${AvatarEditorGridPartItem.SPRITE_PREFIX}${part.type}_${part.id}_${direction}`
            + `_${AvatarEditorGridPartItem.SPRITE_FRAME}`;

        // AS3 asks the flat Flash library. This port's bundles key their frames by
        // `<library>_<name>` and keep the offsets in a separate map, so the sprite has to come
        // through the same alias collection the room renderer uses — see
        // `IAvatarRenderManager.getSpriteAsset()`.
        const asset = this._renderManager?.getSpriteAsset(name) ?? null;

        if(asset === null) return null;

        const content = AvatarTextureUtils.toImageBitmap(asset.texture);

        if(content === null) return null;

        return {
            content,
            // AS3's `BitmapDataAsset.offset` is the *negated* draw origin, which is why every
            // caller writes `-asset.offset.x`. `IGraphicAsset` stores it the other way round.
            offset: {x: -asset.offsetX, y: -asset.offsetY},
            rectangle: {width: asset.width, height: asset.height}
        };
    }

    // TS-only: `flash.geom.Rectangle.union()`, which starts from an empty rect at the origin —
    // hence the null seed rather than a zero rect, which would anchor every box to (0,0).
    private static unionRect(left: IThumbRect | null, right: IThumbRect): IThumbRect
    {
        if(left === null) return right;

        const x = Math.min(left.x, right.x);
        const y = Math.min(left.y, right.y);

        return {
            x,
            y,
            width: Math.max(left.x + left.width, right.x + right.width) - x,
            height: Math.max(left.y + left.height, right.y + right.height) - y
        };
    }

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::sortByDrawOrder()
    // A type absent from DRAW_ORDER indexes to −1 and therefore sorts first, in front of nothing.
    private static sortByDrawOrder(left: IFigurePart, right: IFigurePart): number
    {
        return AvatarEditorGridPartItem.DRAW_ORDER.indexOf(left.type)
            - AvatarEditorGridPartItem.DRAW_ORDER.indexOf(right.type);
    }

    // TS-only: AS3 inlines the lazy static fetch inside `renderThumb()`.
    private getDownloadIcon(): ImageBitmap | null
    {
        if(AvatarEditorGridPartItem._downloadIcon !== null) return AvatarEditorGridPartItem._downloadIcon;

        AvatarEditorGridPartItem._downloadIcon =
            this._model?.getAssetBitmap(AvatarEditorGridPartItem.DOWNLOAD_ICON_ASSET) ?? null;

        return AvatarEditorGridPartItem._downloadIcon;
    }

    // TS-only: the grid model exposes the avatar renderer directly instead of walking the editor owner chain.
    private resolveRenderManager(): IAvatarRenderManager | null
    {
        return this._model?.avatarRenderManager ?? null;
    }
}
