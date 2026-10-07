/**
 * FurnitureVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureVisualization
 *
 * Core furniture visualization pipeline:
 * update → updateObject → updateModel → updateAnimation → updateSprites → updateSprite.
 * Resolves asset names: "{type}_{size}_{layer}_{dir}_{frame}".
 * Per-layer: tag, ink→blendMode, alpha, color, offsets, depth.
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {IRoomObjectSprite} from '../../object/visualization/IRoomObjectSprite';
import type {IRoomObjectVisualizationData} from '../../object/visualization/IRoomObjectVisualizationData';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import {RoomObjectSpriteVisualization} from '../../object/visualization/RoomObjectSpriteVisualization';
import {FurnitureVisualizationData} from './FurnitureVisualizationData';

export class FurnitureVisualization extends RoomObjectSpriteVisualization 
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::Z_MULTIPLIER
    protected static readonly Z_MULTIPLIER: number = Math.sqrt(0.5);

    private static readonly UPDATE_INTERVAL: number = 41;

    protected _alphaMultiplier: number = 1;
    protected _alphaChanged: boolean = true;
    protected _layerCount: number = 0;
    protected _shadowLayerIndex: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::_lastUpdateTime
    // AS3 declares it protected, and FurnitureFurniChestVisualization times its icon bob off it.
    protected _lastUpdateTime: number = -1000;
    private _objectUpdateCounter: number = -1;
    private _geometryDirection: number = NaN;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::_selectedColor
    private _selectedColor: number = -1;
    // Derived name: `_invisibleLayer` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::_invisibleLayer
    private _invisibleLayer: boolean = false;
    private _adClickUrl: string | null = null;
    private _clickHandling: boolean = false;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::_assetNames
    private _assetNames: (string | null)[] = [];
    private _assetNamesHaveFrame: boolean[] = [];
    private _furnitureLift: number = 0;
    // protected: AnimatedPetVisualization reads this directly, as its AS3 counterpart does.
    // Name DERIVED from its use (the size updateObject() resolved for this frame): the field is
    // `_SafeStr_4728` in the primary tree and exists in no readable one. Not a recovered name.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::_SafeStr_4728
    protected _resolvedSize: number = -1;
    private _cachedDirectionId: number = -1;
    private _cachedScale: number = 0;
    private _spriteTags: (string | null)[] = [];
    private _spriteAlphas: (number | null)[] = [];
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::_spriteColors
    private _spriteColors: (number | null)[] = [];
    private _spriteXOffsets: (number | null)[] = [];
    private _spriteYOffsets: (number | null)[] = [];
    private _spriteZOffsets: (number | null)[] = [];
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::_spriteMouseCaptures
    private _spriteMouseCaptures: (boolean | null)[] = [];
    private _spriteInks: (number | null)[] = [];
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::_updatedLayers
    private _updatedLayers: number = 0;
    private _lookThroughChanged: boolean = false;
    private _filtersChanged: boolean = false;

    constructor() 
    {
        super();
        this.reset();
    }

    private _lookThrough: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::set lookThrough()
    set lookThrough(value: boolean) 
    {
        if(this._lookThrough !== value) 
        {
            this._lookThroughChanged = true;
            this._lookThrough = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::_filters
    private _filters: unknown[] | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::get filters()
    get filters(): unknown[] | null 
    {
        return this._filters;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::set filters()
    set filters(value: unknown[] | null) 
    {
        this._filters = value;
        this._filtersChanged = true;
    }

    protected override _direction: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::get direction()
    protected get direction(): number 
    {
        return this._direction;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::set direction()
    protected set direction(value: number) 
    {
        this._direction = value;
    }

    private _data: FurnitureVisualizationData | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::get data()
    protected get data(): FurnitureVisualizationData | null 
    {
        return this._data;
    }

    private _type: string = '';

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::get type()
    protected get type(): string 
    {
        return this._type;
    }

    override dispose(): void 
    {
        super.dispose();
        this._data = null;
        this._assetNames = [];
        this._assetNamesHaveFrame = [];
        this._spriteTags = [];
        this._spriteAlphas = [];
        this._spriteColors = [];
        this._spriteXOffsets = [];
        this._spriteYOffsets = [];
        this._spriteZOffsets = [];
        this._spriteMouseCaptures = [];
        this._spriteInks = [];
        this._filters = null;
    }

    override initialize(data: IRoomObjectVisualizationData): boolean 
    {
        this.reset();

        if(data === null || !(data instanceof FurnitureVisualizationData)) 
        {
            return false;
        }

        this._data = data;
        this._type = this._data.getType();

        return true;
    }

    override update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean): void 
    {
        if(geometry === null) 
        {
            return;
        }

        if(time < this._lastUpdateTime + FurnitureVisualization.UPDATE_INTERVAL) 
        {
            return;
        }

        this._lastUpdateTime += FurnitureVisualization.UPDATE_INTERVAL;

        if(this._lastUpdateTime + FurnitureVisualization.UPDATE_INTERVAL < time) 
        {
            this._lastUpdateTime = time - FurnitureVisualization.UPDATE_INTERVAL;
        }

        let fullUpdate = false;
        const scale = geometry.scale;

        if(this.updateObject(scale, geometry.direction.x)) 
        {
            fullUpdate = true;
        }

        if(this.updateModel(scale)) 
        {
            fullUpdate = true;
        }

        if(this._lookThroughChanged) 
        {
            fullUpdate = true;
            this._lookThroughChanged = false;
        }

        if(this._filtersChanged) 
        {
            fullUpdate = true;
            this._filtersChanged = false;
        }

        let animationUpdate = 0;

        if(skipUpdate) 
        {
            this._updatedLayers |= this.updateAnimation(scale);
        }
        else 
        {
            animationUpdate = this.updateAnimation(scale) | this._updatedLayers;
            this._updatedLayers = 0;
        }

        if(fullUpdate || animationUpdate !== 0) 
        {
            this.updateSprites(scale, fullUpdate, animationUpdate);
            this._scale = scale;
            this.increaseUpdateId();
        }
    }

    protected override reset(): void 
    {
        super.reset();
        this._direction = -1;
        this._objectUpdateCounter = 0xFFFFFFFF;
        this._data = null;
        this._assetNames = [];
        this._assetNamesHaveFrame = [];
        this._spriteTags = [];
        this._spriteAlphas = [];
        this._spriteColors = [];
        this._spriteXOffsets = [];
        this._spriteYOffsets = [];
        this._spriteZOffsets = [];
        this._spriteMouseCaptures = [];
        this._spriteInks = [];
        // AS3 calls the protected clearSprites() here (dispose every sprite, then empty the
        // array). createSprites(0) already does exactly that — it disposes down to the target
        // count and this target is 0 — so no separate clearSprites() was ported.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::clearSprites()
        this.createSprites(0);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::updateSprites()
    protected updateSprites(scale: number, fullUpdate: boolean, animatedLayers: number): void 
    {
        if(this._layerCount !== this.spriteCount) 
        {
            this.createSprites(this._layerCount);
        }

        if(fullUpdate) 
        {
            for(let i = this.spriteCount - 1; i >= 0; i--) 
            {
                this.updateSprite(scale, i);
            }
        }
        else 
        {
            let layer = 0;

            while(animatedLayers > 0) 
            {
                if(animatedLayers & 1) 
                {
                    this.updateSprite(scale, layer);
                }

                layer++;
                animatedLayers >>= 1;
            }
        }

        this._alphaChanged = false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::updateSprite()
    protected updateSprite(scale: number, layerIndex: number): void 
    {
        const assetName = this.getSpriteAssetName(scale, layerIndex);
        const sprite = this.getSprite(layerIndex);

        if(sprite === null) 
        {
            return;
        }

        if(assetName === null || assetName.length === 0) 
        {
            this.resetSprite(sprite, layerIndex);
            return;
        }

        const asset = this.getAsset(assetName, layerIndex);

        if(asset !== null && asset.texture !== null)
        {
            sprite.visible = true;
            sprite.objectType = this._type;
            sprite.texture = asset.texture;
            sprite.flipH = asset.flipH;
            sprite.flipV = asset.flipV;
            sprite.direction = this._direction;

            let zOffset: number;

            if(layerIndex !== this._shadowLayerIndex) 
            {
                sprite.tag = this.getSpriteTag(scale, this._direction, layerIndex);
                sprite.alpha = this.getSpriteAlpha(scale, this._direction, layerIndex);
                sprite.color = this.getSpriteColor(scale, layerIndex, this._selectedColor);
                sprite.offsetX = asset.offsetX + this.getSpriteXOffset(scale, this._direction, layerIndex);
                sprite.offsetY = asset.offsetY + this.getSpriteYOffset(scale, this._direction, layerIndex);
                sprite.alphaTolerance = this.getSpriteMouseCapture(scale, this._direction, layerIndex) ? 128 : 256;
                sprite.blendMode = this.getBlendMode(this.getSpriteInk(scale, this._direction, layerIndex));

                // AS3 FurnitureVisualization.as:319-322 — optional per-sprite horizontal flip.
                if(this.getSpriteFlipH(scale, this._direction, layerIndex))
                {
                    sprite.flipH = !sprite.flipH;
                }

                // AS3 FurnitureVisualization.as:323-327 — hide the "invisible"-tagged
                // sprite of a furni whose furniture_invisible_layer is set.
                if(this._invisibleLayer && sprite.tag === 'invisible')
                {
                    sprite.alpha = 0;
                    sprite.alphaTolerance = 256;
                }

                zOffset = this.getSpriteZOffset(scale, this._direction, layerIndex);
                zOffset -= layerIndex * 0.001;
            }
            else 
            {
                // Shadow sprite
                sprite.offsetX = asset.offsetX;
                sprite.offsetY = asset.offsetY + this.getSpriteYOffset(scale, this._direction, layerIndex);
                const shadowAlpha = Math.floor(48 * this._alphaMultiplier);
                sprite.alpha = shadowAlpha;
                sprite.alphaTolerance = 256;
                zOffset = 1;
            }

            if(this._lookThrough) 
            {
                sprite.alpha = Math.floor(sprite.alpha * 0.2);
            }

            zOffset *= FurnitureVisualization.Z_MULTIPLIER;

            // The stacked-on-furniture correction that used to sit here moved to
            // `RoomRenderingCanvas.renderObject()`: it keyed on `getLocation().z > 0`, which is true
            // for anything on a raised floor tile as well, and only the canvas can reach the floor's
            // own altitude at the tile to tell the two apart. It also has to apply to avatars.
            sprite.relativeDepth = zOffset;
            sprite.assetName = asset.assetName;
            sprite.libraryAssetName = this.getLibraryAssetNameForSprite(asset, sprite);
            sprite.assetPosture = this.getPostureForAssetFile(scale, asset.libraryAssetName);
            sprite.clickHandling = this._clickHandling;

            this.updateSpriteFilters(scale, sprite, layerIndex);
        }
        else
        {
            this.resetSprite(sprite, layerIndex);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::updateSpriteFilters()
    // In "add" blend the port previously left the sprite's old filters attached; AS3
    // clears them. Off "add", it merges the visualization's own _filters with the
    // per-sprite getSpriteFilters() hook, short-circuiting when the concat is unchanged.
    private updateSpriteFilters(scale: number, sprite: IRoomObjectSprite, layerIndex: number): void
    {
        if(sprite.blendMode !== 'add')
        {
            const filters = this.getSpriteFilters(scale, this._direction, layerIndex);

            if(filters === null)
            {
                sprite.filters = this._filters;
            }
            else if(this._filters === null)
            {
                sprite.filters = filters;
            }
            else
            {
                if(FurnitureVisualization.concatListWillEqual(this._filters, filters, sprite.filters))
                {
                    return;
                }

                sprite.filters = this._filters.concat(filters);
            }
        }
        else if(sprite.filters !== null)
        {
            sprite.filters = null;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteFilters()
    protected getSpriteFilters(_scale: number, _direction: number, _layerIndex: number): unknown[] | null
    {
        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteFlipH()
    protected getSpriteFlipH(_scale: number, _direction: number, _layerIndex: number): boolean
    {
        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::concatListWillEqual()
    private static concatListWillEqual(a: unknown[], b: unknown[], current: unknown[] | null): boolean
    {
        if(current === null)
        {
            return false;
        }

        if(a.length + b.length !== current.length)
        {
            return false;
        }

        for(let i = 0; i < a.length; i++)
        {
            if(a[i] !== current[i])
            {
                return false;
            }
        }

        for(let i = 0; i < b.length; i++)
        {
            if(b[i] !== current[a.length + i])
            {
                return false;
            }
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getLibraryAssetNameForSprite()
    protected getLibraryAssetNameForSprite(asset: IGraphicAsset, _sprite: IRoomObjectSprite): string 
    {
        return asset.libraryAssetName;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getBlendMode()
    protected getBlendMode(ink: number): string 
    {
        switch(ink) 
        {
            case 1:
                return 'add';
            case 2:
                return 'subtract';
            case 3:
                return 'darken';
            case 4:
                return 'difference';
            case 5:
                return 'multiply';
            case 6:
                return 'invert';
            case 7:
                return 'screen';
            default:
                return 'normal';
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::updateObject()
    protected updateObject(scale: number, geometryDirection: number): boolean 
    {
        const roomObject = this.object;

        if(roomObject === null) 
        {
            return false;
        }

        if(this._objectUpdateCounter !== roomObject.getUpdateID() || scale !== this._scale || geometryDirection !== this._geometryDirection)
        {
            let direction = (roomObject.getDirection().x - (geometryDirection + 135)) % 360;
            direction = ((direction % 360) + 360) % 360;

            if(this._data !== null)
            {
                this._direction = this._data.getDirectionValue(scale, direction);
            }

            this._objectUpdateCounter = roomObject.getUpdateID();
            this._geometryDirection = geometryDirection;
            this._scale = scale;
            this.updateAssetAndSpriteCache(scale, this._direction);

            return true;
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::updateModel()
    protected updateModel(_scale: number): boolean 
    {
        const roomObject = this.object;

        if(roomObject === null) 
        {
            return false;
        }

        const model = roomObject.getModel();

        if(model === null) 
        {
            return false;
        }

        if(this._updateModelCounter !== model.getUpdateID()) 
        {
            this._selectedColor = model.getNumber('furniture_color') || 0;
            let alphaMultiplier = model.getNumber('furniture_alpha_multiplier');

            if(isNaN(alphaMultiplier)) 
            {
                alphaMultiplier = 1;
            }

            if(alphaMultiplier !== this._alphaMultiplier)
            {
                this._alphaMultiplier = alphaMultiplier;
                this._alphaChanged = true;
            }

            // AS3 FurnitureVisualization.as:501-506 — furniture_invisible_layer > 0
            // marks a furni whose "invisible"-tagged sprites must be hidden.
            const invisibleLayer = model.getNumber('furniture_invisible_layer') > 0;

            if(invisibleLayer !== this._invisibleLayer)
            {
                this._invisibleLayer = invisibleLayer;
                this._alphaChanged = true;
            }

            this._adClickUrl = this.getAdClickUrl(model);
            this._clickHandling = this._adClickUrl !== null && this._adClickUrl !== '' && this._adClickUrl.indexOf('http') === 0;
            this._furnitureLift = model.getNumber('furniture_lift_amount') || 0;
            this._updateModelCounter = model.getUpdateID();

            return true;
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getAdClickUrl()
    protected getAdClickUrl(model: { getString(key: string): string | null }): string | null 
    {
        return model.getString('furniture_ad_url');
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::updateAnimation()
    protected updateAnimation(_scale: number): number 
    {
        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::updateLayerCount()
    protected updateLayerCount(count: number, scale: number): void 
    {
        this._layerCount = count;
        this._shadowLayerIndex = this._layerCount - this.getAdditionalSpriteCount(scale);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getAdditionalSpriteCount()
    protected getAdditionalSpriteCount(_scale: number): number 
    {
        return 1;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getFrameNumber()
    protected getFrameNumber(_scale: number, _layerIndex: number): number 
    {
        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getPostureForAssetFile()
    protected getPostureForAssetFile(_scale: number, _libraryAssetName: string): string | null 
    {
        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getAsset()
    protected getAsset(name: string, _layerIndex: number = -1): IGraphicAsset | null 
    {
        if(this.assetCollection !== null) 
        {
            return this.assetCollection.getAsset(name);
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteAssetName()
    protected getSpriteAssetName(scale: number, layerIndex: number): string 
    {
        if(this._data === null || layerIndex >= FurnitureVisualizationData.LAYER_NAMES.length) 
        {
            return '';
        }

        let baseName = this._assetNames[layerIndex] || null;
        let needsFrame = this._assetNamesHaveFrame[layerIndex] || false;

        if(baseName === null || baseName.length === 0) 
        {
            baseName = this.getSpriteAssetNameWithoutFrame(scale, layerIndex, true);
            needsFrame = this._resolvedSize !== 1;
        }

        if(needsFrame) 
        {
            return baseName + this.getFrameNumber(scale, layerIndex);
        }

        return baseName;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteAssetNameWithoutFrame()
    protected getSpriteAssetNameWithoutFrame(scale: number, layerIndex: number, cache: boolean): string 
    {
        const resolvedSize = cache ? this._resolvedSize : this.getSize(scale);
        const isIcon = resolvedSize === 1;

        let layerName: string;

        if(layerIndex !== this._shadowLayerIndex) 
        {
            layerName = FurnitureVisualizationData.LAYER_NAMES[layerIndex];
        }
        else 
        {
            layerName = 'sd';
        }

        let assetName: string;

        if(isIcon) 
        {
            assetName = this._type + '_icon_' + layerName;
        }
        else 
        {
            assetName = this._type + '_' + resolvedSize + '_' + layerName + '_' + this._direction + '_';
        }

        if(cache) 
        {
            this._assetNames[layerIndex] = assetName;
            this._assetNamesHaveFrame[layerIndex] = !isIcon;
        }

        return assetName;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteTag()
    protected getSpriteTag(scale: number, direction: number, layerIndex: number): string 
    {
        if(this._spriteTags[layerIndex] !== null && this._spriteTags[layerIndex] !== undefined) 
        {
            return this._spriteTags[layerIndex]!;
        }

        if(this._data === null) 
        {
            return '';
        }

        const tag = this._data.getTag(scale, direction, layerIndex);
        this._spriteTags[layerIndex] = tag;

        return tag;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteAlpha()
    protected getSpriteAlpha(scale: number, direction: number, layerIndex: number): number 
    {
        if(this._spriteAlphas[layerIndex] !== null && this._spriteAlphas[layerIndex] !== undefined && !this._alphaChanged) 
        {
            return this._spriteAlphas[layerIndex]!;
        }

        if(this._data === null) 
        {
            return 255;
        }

        let alpha = this._data.getAlpha(scale, direction, layerIndex);
        alpha = Math.floor(alpha * this._alphaMultiplier);
        this._spriteAlphas[layerIndex] = alpha;

        return alpha;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteColor()
    protected getSpriteColor(scale: number, layerIndex: number, colorId: number): number 
    {
        if(this._spriteColors[layerIndex] !== null && this._spriteColors[layerIndex] !== undefined) 
        {
            return this._spriteColors[layerIndex]!;
        }

        if(this._data === null) 
        {
            return 0xFFFFFF;
        }

        const color = this._data.getColor(scale, layerIndex, colorId);
        this._spriteColors[layerIndex] = color;

        return color;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteXOffset()
    protected getSpriteXOffset(scale: number, direction: number, layerIndex: number): number 
    {
        if(this._spriteXOffsets[layerIndex] !== null && this._spriteXOffsets[layerIndex] !== undefined) 
        {
            return this._spriteXOffsets[layerIndex]!;
        }

        if(this._data === null) 
        {
            return 0;
        }

        const offset = this._data.getXOffset(scale, direction, layerIndex);
        this._spriteXOffsets[layerIndex] = offset;

        return offset;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteYOffset()
    protected getSpriteYOffset(scale: number, direction: number, layerIndex: number): number 
    {
        if(layerIndex !== this._shadowLayerIndex) 
        {
            if(this._spriteYOffsets[layerIndex] !== null && this._spriteYOffsets[layerIndex] !== undefined) 
            {
                return this._spriteYOffsets[layerIndex]!;
            }

            if(this._data !== null) 
            {
                const offset = this._data.getYOffset(scale, direction, layerIndex);
                this._spriteYOffsets[layerIndex] = offset;

                return offset;
            }

            return 0;
        }

        // Shadow layer Y offset based on furniture lift
        return Math.ceil(this._furnitureLift * (scale / 2));
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteMouseCapture()
    protected getSpriteMouseCapture(scale: number, direction: number, layerIndex: number): boolean 
    {
        if(this._spriteMouseCaptures[layerIndex] !== null && this._spriteMouseCaptures[layerIndex] !== undefined) 
        {
            return this._spriteMouseCaptures[layerIndex]!;
        }

        if(this._data === null) 
        {
            return true;
        }

        const capture = !this._data.getIgnoreMouse(scale, direction, layerIndex);
        this._spriteMouseCaptures[layerIndex] = capture;

        return capture;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteInk()
    protected getSpriteInk(scale: number, direction: number, layerIndex: number): number 
    {
        if(this._spriteInks[layerIndex] !== null && this._spriteInks[layerIndex] !== undefined) 
        {
            return this._spriteInks[layerIndex]!;
        }

        if(this._data === null) 
        {
            return 0;
        }

        const ink = this._data.getInk(scale, direction, layerIndex);
        this._spriteInks[layerIndex] = ink;

        return ink;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSpriteZOffset()
    protected getSpriteZOffset(scale: number, direction: number, layerIndex: number): number 
    {
        if(this._spriteZOffsets[layerIndex] !== null && this._spriteZOffsets[layerIndex] !== undefined) 
        {
            return this._spriteZOffsets[layerIndex]!;
        }

        if(this._data === null) 
        {
            return 0;
        }

        const offset = this._data.getZOffset(scale, direction, layerIndex);
        this._spriteZOffsets[layerIndex] = offset;

        return offset;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::getSize()
    protected getSize(scale: number): number 
    {
        if(this._data !== null) 
        {
            return this._data.getSize(scale);
        }

        return scale;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::resetSprite()
    private resetSprite(sprite: IRoomObjectSprite, layerIndex: number): void 
    {
        sprite.texture = null;
        sprite.assetName = '';
        sprite.assetPosture = null;
        sprite.alpha = 0;
        sprite.tag = '';
        sprite.flipH = false;
        sprite.flipV = false;
        sprite.offsetX = 0;
        sprite.offsetY = 0;
        sprite.relativeDepth = 0;
        sprite.clickHandling = false;

        if(this._alphaChanged) 
        {
            this._spriteAlphas[layerIndex] = null;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualization.as::updateAssetAndSpriteCache()
    private updateAssetAndSpriteCache(scale: number, direction: number): void 
    {
        if(this._cachedDirectionId !== direction || this._cachedScale !== scale) 
        {
            this._assetNames = [];
            this._assetNamesHaveFrame = [];
            this._spriteTags = [];
            this._spriteAlphas = [];
            this._spriteColors = [];
            this._spriteXOffsets = [];
            this._spriteYOffsets = [];
            this._spriteZOffsets = [];
            this._spriteMouseCaptures = [];
            this._spriteInks = [];
            this._cachedDirectionId = direction;
            this._cachedScale = scale;
            this._resolvedSize = this.getSize(scale);
            this.updateLayerCount(this._data!.getLayerCount(scale) + this.getAdditionalSpriteCount(scale), scale);
        }
    }
}
