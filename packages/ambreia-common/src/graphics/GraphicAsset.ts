/**
 * GraphicAsset
 *
 * @see com.sulake.room.object.visualization.utils.GraphicAsset
 *
 * Concrete implementation of IGraphicAsset with object pooling.
 * Wraps a PixiJS Texture with flip/offset metadata.
 */
import type {Texture} from 'pixi.js';
import type {IGraphicAsset} from './IGraphicAsset';

export class GraphicAsset implements IGraphicAsset
{
    private static _pool: GraphicAsset[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/utils/GraphicAsset.as::_initialized
    private _initialized: boolean = false;

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::_assetName
    private _assetName: string = '';

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::get assetName()
    get assetName(): string
    {
        return this._assetName;
    }

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::_libraryAssetName
    private _libraryAssetName: string = '';

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::get libraryAssetName()
    get libraryAssetName(): string
    {
        return this._libraryAssetName;
    }

    private _texture: Texture | null = null;

    get texture(): Texture | null
    {
        return this._texture;
    }

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::_flipH
    private _flipH: boolean = false;

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::get flipH()
    get flipH(): boolean
    {
        return this._flipH;
    }

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::_flipV
    private _flipV: boolean = false;

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::get flipV()
    get flipV(): boolean
    {
        return this._flipV;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/utils/GraphicAsset.as::_usesPalette
    private _usesPalette: boolean = false;

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::get usesPalette()
    get usesPalette(): boolean
    {
        return this._usesPalette;
    }

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::_offsetX
    private _offsetX: number = 0;

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::get offsetX()
    get offsetX(): number
    {
        if(!this._flipH)
        {
            return this._offsetX;
        }

        return -(this.width + this._offsetX);
    }

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::_offsetY
    private _offsetY: number = 0;

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::get offsetY()
    get offsetY(): number
    {
        if(!this._flipV)
        {
            return this._offsetY;
        }

        return -(this.height + this._offsetY);
    }

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::_width
    private _width: number = 0;

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::get width()
    get width(): number
    {
        this.initialize();
        return this._width;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/utils/GraphicAsset.as::_height
    private _height: number = 0;

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::get height()
    get height(): number
    {
        this.initialize();
        return this._height;
    }

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::get originalOffsetX()
    get originalOffsetX(): number
    {
        return this._offsetX;
    }

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::get originalOffsetY()
    get originalOffsetY(): number
    {
        return this._offsetY;
    }

    /**
	 * Allocate a GraphicAsset from the object pool or create a new one.
	 */
    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::allocate()
    static allocate(
        assetName: string,
        libraryAssetName: string,
        texture: Texture | null,
        flipH: boolean,
        flipV: boolean,
        offsetX: number,
        offsetY: number,
        usesPalette: boolean = false
    ): GraphicAsset
    {
        const asset = GraphicAsset._pool.length > 0
            ? GraphicAsset._pool.pop()!
            : new GraphicAsset();

        asset._assetName = assetName;
        asset._libraryAssetName = libraryAssetName;

        if(texture !== null)
        {
            asset._texture = texture;
            asset._initialized = false;
        }
        else
        {
            asset._texture = null;
            asset._initialized = true;
        }

        asset._flipH = flipH;
        asset._flipV = flipV;
        asset._offsetX = offsetX;
        asset._offsetY = offsetY;
        asset._usesPalette = usesPalette;

        return asset;
    }

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::recycle()
    recycle(): void
    {
        this._texture = null;
        GraphicAsset._pool.push(this);
    }

    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAsset.as::initialize()
    private initialize(): void
    {
        if(!this._initialized && this._texture !== null)
        {
            this._width = this._texture.width;
            this._height = this._texture.height;
            this._initialized = true;
        }
    }
}
