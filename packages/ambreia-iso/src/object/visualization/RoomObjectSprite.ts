/**
 * RoomObjectSprite
 *
 * Based on AS3: com.sulake.room.object.visualization.RoomObjectSprite
 *
 * Represents a single visual sprite element in a room object visualization.
 * Tracks property changes via updateId for efficient rendering.
 */
import type {Texture} from 'pixi.js';
import type {IRoomObjectSprite} from './IRoomObjectSprite';
import {RoomObjectSpriteType} from '../enum/RoomObjectSpriteType';

let spriteInstanceCounter = 0;

export class RoomObjectSprite implements IRoomObjectSprite
{
    constructor()
    {
        this._instanceId = spriteInstanceCounter++;
    }

    private _texture: Texture | null = null;

    // Texture
    get texture(): Texture | null
    {
        return this._texture;
    }

    set texture(value: Texture | null)
    {
        if(value === this._texture)
        {
            return;
        }

        if(value !== null)
        {
            this._width = value.width;
            this._height = value.height;
        }

        this._texture = value;
        this._updateId++;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::_assetName
    private _assetName: string = '';

    // Asset name
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get assetName()
    get assetName(): string
    {
        return this._assetName;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set assetName()
    set assetName(value: string)
    {
        if(value === this._assetName)
        {
            return;
        }

        this._assetName = value;
        this._updateId++;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::_libraryAssetName
    private _libraryAssetName: string = '';

    // Library asset name
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get libraryAssetName()
    get libraryAssetName(): string
    {
        return this._libraryAssetName;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set libraryAssetName()
    set libraryAssetName(value: string)
    {
        this._libraryAssetName = value;
    }

    private _assetPosture: string | null = null;

    // Asset posture
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get assetPosture()
    get assetPosture(): string | null
    {
        return this._assetPosture;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set assetPosture()
    set assetPosture(value: string | null)
    {
        this._assetPosture = value;
    }

    private _assetGesture: string | null = null;

    // Asset gesture
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get assetGesture()
    get assetGesture(): string | null
    {
        return this._assetGesture;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set assetGesture()
    set assetGesture(value: string | null)
    {
        this._assetGesture = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/RoomObjectSprite.as::_visible
    private _visible: boolean = true;

    // Visible
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get visible()
    get visible(): boolean
    {
        return this._visible;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set visible()
    set visible(value: boolean)
    {
        if(value === this._visible)
        {
            return;
        }

        this._visible = value;
        this._updateId++;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/RoomObjectSprite.as::_tag
    private _tag: string = '';

    // Tag
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get tag()
    get tag(): string
    {
        return this._tag;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set tag()
    set tag(value: string)
    {
        if(value === this._tag)
        {
            return;
        }

        this._tag = value;
        this._updateId++;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::_alpha
    private _alpha: number = 255;

    // Alpha
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get alpha()
    get alpha(): number
    {
        return this._alpha;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set alpha()
    set alpha(value: number)
    {
        value = value & 255;

        if(value === this._alpha)
        {
            return;
        }

        this._alpha = value;
        this._updateId++;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::_color
    private _color: number = 0xFFFFFF;

    // Color
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get color()
    get color(): number
    {
        return this._color;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set color()
    set color(value: number)
    {
        value = value & 0xFFFFFF;

        if(value === this._color)
        {
            return;
        }

        this._color = value;
        this._updateId++;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::_blendMode
    private _blendMode: string = 'normal';

    // Blend mode
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get blendMode()
    get blendMode(): string
    {
        return this._blendMode;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set blendMode()
    set blendMode(value: string)
    {
        if(value === this._blendMode)
        {
            return;
        }

        this._blendMode = value;
        this._updateId++;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::_flipH
    private _flipH: boolean = false;

    // Flip H
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get flipH()
    get flipH(): boolean
    {
        return this._flipH;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set flipH()
    set flipH(value: boolean)
    {
        if(value === this._flipH)
        {
            return;
        }

        this._flipH = value;
        this._updateId++;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::_flipV
    private _flipV: boolean = false;

    // Flip V
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get flipV()
    get flipV(): boolean
    {
        return this._flipV;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set flipV()
    set flipV(value: boolean)
    {
        if(value === this._flipV)
        {
            return;
        }

        this._flipV = value;
        this._updateId++;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/RoomObjectSprite.as::_direction
    private _direction: number = 0;

    // Direction
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get direction()
    get direction(): number
    {
        return this._direction;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set direction()
    set direction(value: number)
    {
        this._direction = value;
    }

    private _offsetX: number = 0;

    // Offset X
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get offsetX()
    get offsetX(): number
    {
        return this._offsetX;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set offsetX()
    set offsetX(value: number)
    {
        if(value === this._offsetX)
        {
            return;
        }

        this._offsetX = value;
        this._updateId++;
    }

    private _offsetY: number = 0;

    // Offset Y
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get offsetY()
    get offsetY(): number
    {
        return this._offsetY;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set offsetY()
    set offsetY(value: number)
    {
        if(value === this._offsetY)
        {
            return;
        }

        this._offsetY = value;
        this._updateId++;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::_width
    private _width: number = 0;

    // Width (read-only)
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get width()
    get width(): number
    {
        return this._width;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/RoomObjectSprite.as::_height
    private _height: number = 0;

    // Height (read-only)
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get height()
    get height(): number
    {
        return this._height;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/RoomObjectSprite.as::_relativeDepth
    private _relativeDepth: number = 0;

    // Relative depth
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get relativeDepth()
    get relativeDepth(): number
    {
        return this._relativeDepth;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set relativeDepth()
    set relativeDepth(value: number)
    {
        if(value === this._relativeDepth)
        {
            return;
        }

        this._relativeDepth = value;
        this._updateId++;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::_varyingDepth
    private _varyingDepth: boolean = false;

    // Varying depth
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get varyingDepth()
    get varyingDepth(): boolean
    {
        return this._varyingDepth;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set varyingDepth()
    set varyingDepth(value: boolean)
    {
        if(value === this._varyingDepth)
        {
            return;
        }

        this._varyingDepth = value;
        this._updateId++;
    }

    private _alphaTolerance: number = 128;

    // Alpha tolerance
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get alphaTolerance()
    get alphaTolerance(): number
    {
        return this._alphaTolerance;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set alphaTolerance()
    set alphaTolerance(value: number)
    {
        if(value === this._alphaTolerance)
        {
            return;
        }

        this._alphaTolerance = value;
        this._updateId++;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/RoomObjectSprite.as::_clickHandling
    private _clickHandling: boolean = false;

    // Click handling
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get clickHandling()
    get clickHandling(): boolean
    {
        return this._clickHandling;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set clickHandling()
    set clickHandling(value: boolean)
    {
        if(value === this._clickHandling)
        {
            return;
        }

        this._clickHandling = value;
        this._updateId++;
    }

    private _skipMouseHandling: boolean = false;

    // Skip mouse handling
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get skipMouseHandling()
    get skipMouseHandling(): boolean
    {
        return this._skipMouseHandling;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set skipMouseHandling()
    set skipMouseHandling(value: boolean)
    {
        this._skipMouseHandling = value;
    }

    private _updateId: number = 0;

    // Update ID (read-only)
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get updateId()
    get updateId(): number
    {
        return this._updateId;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::_filters
    private _filters: unknown[] | null = null;

    // Filters
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get filters()
    get filters(): unknown[] | null
    {
        return this._filters;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set filters()
    set filters(value: unknown[] | null)
    {
        if(value === this._filters)
        {
            return;
        }

        this._filters = value;
        this._updateId++;
    }

    protected _spriteType: number = RoomObjectSpriteType.DEFAULT;

    // Sprite type
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get spriteType()
    get spriteType(): number
    {
        return this._spriteType;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set spriteType()
    set spriteType(value: number)
    {
        this._spriteType = value;
    }

    private _objectType: string | null = null;

    // Object type
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get objectType()
    get objectType(): string | null
    {
        return this._objectType;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set objectType()
    set objectType(value: string | null)
    {
        this._objectType = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/RoomObjectSprite.as::_instanceId
    private _instanceId: number;

    // Instance ID (read-only)
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get instanceId()
    get instanceId(): number
    {
        return this._instanceId;
    }

    private _planeId: number = 0;

    // Plane ID
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::get planeId()
    get planeId(): number
    {
        return this._planeId;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::set planeId()
    set planeId(value: number)
    {
        this._planeId = value;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSprite.as::dispose()
    dispose(): void
    {
        this._texture = null;
        this._width = 0;
        this._height = 0;
    }
}
