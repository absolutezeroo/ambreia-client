/**
 * FurniturePlane
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurniturePlane
 *
 * Represents a 3D plane on a piece of furniture. Handles perspective
 * transformation of texture onto the plane using matrix transforms.
 * Supports rotation (for diagonal furniture orientations) and visibility
 * culling based on camera direction.
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {IVector3d} from '../../utils/IVector3d';
import {Vector3d} from '../../utils/Vector3d';

export class FurniturePlane
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_geometryUpdateId
    private _geometryUpdateId: number = -1;
    private _dirX: number = 0;
    private _dirY: number = 0;
    private _dirZ: number = 0;
    private _lastScale: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_origin
    private _origin: Vector3d;
    private _origLeftSide: Vector3d;
    private _origRightSide: Vector3d;
    private _textureCache: Map<string, HTMLCanvasElement> = new Map();
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_rotated
    private _rotated: boolean = false;
    private _textureName: string | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_cornerA
    private _cornerA: Vector3d;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_cornerB
    private _cornerB: Vector3d;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_cornerC
    private _cornerC: Vector3d;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_cornerD
    private _cornerD: Vector3d;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_width
    private _width: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_height
    private _height: number = 0;

    constructor(location: IVector3d, leftSide: IVector3d, rightSide: IVector3d)
    {
        this._origin = new Vector3d();
        this._location = new Vector3d();
        this._location.assign(location);
        this._leftSide = new Vector3d();
        this._leftSide.assign(leftSide);
        this._rightSide = new Vector3d();
        this._rightSide.assign(rightSide);
        this._origLeftSide = new Vector3d();
        this._origLeftSide.assign(leftSide);
        this._origRightSide = new Vector3d();
        this._origRightSide.assign(rightSide);

        this._normal = Vector3d.crossProduct(this._leftSide, this._rightSide) ?? new Vector3d();

        if(this._normal.length > 0)
        {
            this._normal.mul(1 / this._normal.length);
        }

        this._offset = {x: 0, y: 0};
        this._cornerA = new Vector3d();
        this._cornerB = new Vector3d();
        this._cornerC = new Vector3d();
        this._cornerD = new Vector3d();
    }

    private _location: Vector3d;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::get location()
    get location(): IVector3d
    {
        return this._location;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_leftSide
    private _leftSide: Vector3d;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::get leftSide()
    get leftSide(): IVector3d
    {
        return this._leftSide;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_rightSide
    private _rightSide: Vector3d;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::get rightSide()
    get rightSide(): IVector3d
    {
        return this._rightSide;
    }

    private _visible: boolean = true;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::get visible()
    get visible(): boolean
    {
        return this._visible;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_normal
    private _normal: Vector3d;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::get normal()
    get normal(): IVector3d
    {
        return this._normal;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_bitmapData
    private _bitmapData: HTMLCanvasElement | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::get bitmapData()
    get bitmapData(): HTMLCanvasElement | null
    {
        if(this._visible && this._bitmapData !== null)
        {
            // Clone the bitmap
            const clone = document.createElement('canvas');
            clone.width = this._bitmapData.width;
            clone.height = this._bitmapData.height;
            const ctx = clone.getContext('2d')!;
            ctx.drawImage(this._bitmapData, 0, 0);
            return clone;
        }
        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_offset
    private _offset: { x: number; y: number };

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::get offset()
    get offset(): { x: number; y: number }
    {
        return this._offset;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_relativeDepth
    private _relativeDepth: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::get relativeDepth()
    get relativeDepth(): number
    {
        return this._relativeDepth;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::_color
    private _color: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::get color()
    get color(): number
    {
        return this._color;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::set color()
    set color(value: number)
    {
        this._color = value;
    }

    /**
	 * Set rotation mode (for diagonal furniture).
	 * When rotated, left/right sides are swapped in magnitude.
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::setRotation()
    setRotation(rotated: boolean): void
    {
        if(rotated !== this._rotated)
        {
            if(!rotated)
            {
                this._leftSide.assign(this._origLeftSide);
                this._rightSide.assign(this._origRightSide);
            }
            else
            {
                this._leftSide.assign(this._origLeftSide);
                this._leftSide.mul(this._origRightSide.length / this._origLeftSide.length);
                this._rightSide.assign(this._origRightSide);
                this._rightSide.mul(this._origLeftSide.length / this._origRightSide.length);
            }

            this._geometryUpdateId = -1;
            this._dirX -= 1;
            this._rotated = rotated;
            this.resetTextureCache();
        }
    }

    /**
	 * Update the plane geometry for the current camera state.
	 *
	 * @returns true if the plane bitmap changed and needs re-rendering
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::update()
    update(geometry: IRoomGeometry, time: number): boolean
    {
        if(geometry === null || this._location === null || this._leftSide === null || this._rightSide === null || this._normal === null)
        {
            return false;
        }

        let changed = false;

        if(geometry.updateId !== this._geometryUpdateId)
        {
            this._geometryUpdateId = geometry.updateId;

            const dir = geometry.direction;

            if(dir !== null && (dir.x !== this._dirX || dir.y !== this._dirY || dir.z !== this._dirZ || geometry.scale !== this._lastScale))
            {
                this._dirX = dir.x;
                this._dirY = dir.y;
                this._dirZ = dir.z;
                this._lastScale = geometry.scale;
                changed = true;

                // Check visibility: plane faces away from camera
                const cosAngle = Vector3d.cosAngle(geometry.directionAxis, this._normal);

                if(cosAngle > -0.001)
                {
                    if(this._visible)
                    {
                        this._visible = false;
                        return true;
                    }
                    return false;
                }

                this.updateCorners(geometry);

                const originScreen = geometry.getScreenPosition(this._origin);
                if(originScreen !== null)
                {
                    const depthA = this._cornerA.z - originScreen.z;
                    const depthB = this._cornerB.z - originScreen.z;
                    const depthC = this._cornerC.z - originScreen.z;
                    const depthD = this._cornerD.z - originScreen.z;
                    this._relativeDepth = Math.max(depthA, depthB, depthC, depthD);
                }

                this._visible = true;
            }
        }

        if(this.needsNewTexture(geometry) || changed)
        {
            if(this._bitmapData === null || this._width !== this._bitmapData.width || this._height !== this._bitmapData.height)
            {
                this._bitmapData = null;

                if(this._width < 1 || this._height < 1)
                {
                    return changed;
                }

                this._bitmapData = document.createElement('canvas');
                this._bitmapData.width = this._width;
                this._bitmapData.height = this._height;
            }
            else
            {
                const ctx = this._bitmapData.getContext('2d')!;
                ctx.clearRect(0, 0, this._width, this._height);
            }

            const texture = this.getTexture(geometry, time);

            if(texture !== null)
            {
                this.renderTexture(texture);
            }

            return true;
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::dispose()
    dispose(): void
    {
        this._bitmapData = null;
        this._textureCache.clear();
        this._origin = null!;
        this._location = null!;
        this._leftSide = null!;
        this._rightSide = null!;
        this._origLeftSide = null!;
        this._origRightSide = null!;
        this._normal = null!;
        this._cornerA = null!;
        this._cornerB = null!;
        this._cornerC = null!;
        this._cornerD = null!;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::updateCorners()
    private updateCorners(geometry: IRoomGeometry): void
    {
        const screenA = geometry.getScreenPosition(this._location);
        const locPlusRight = Vector3d.sum(this._location, this._rightSide);
        const locPlusLeftPlusRight = Vector3d.sum(Vector3d.sum(this._location, this._leftSide)!, this._rightSide);
        const locPlusLeft = Vector3d.sum(this._location, this._leftSide);

        if(screenA !== null) this._cornerA.assign(screenA);
        if(locPlusRight !== null)
        {
            const screenB = geometry.getScreenPosition(locPlusRight);
            if(screenB !== null) this._cornerB.assign(screenB);
        }
        if(locPlusLeftPlusRight !== null)
        {
            const screenC = geometry.getScreenPosition(locPlusLeftPlusRight);
            if(screenC !== null) this._cornerC.assign(screenC);
        }
        if(locPlusLeft !== null)
        {
            const screenD = geometry.getScreenPosition(locPlusLeft);
            if(screenD !== null) this._cornerD.assign(screenD);
        }

        const screenPoint = geometry.getScreenPoint(this._origin);
        if(screenPoint !== null)
        {
            this._offset = {x: Math.round(screenPoint.x), y: Math.round(screenPoint.y)};
        }

        // Round corners
        this._cornerA.x = Math.round(this._cornerA.x);
        this._cornerA.y = Math.round(this._cornerA.y);
        this._cornerB.x = Math.round(this._cornerB.x);
        this._cornerB.y = Math.round(this._cornerB.y);
        this._cornerC.x = Math.round(this._cornerC.x);
        this._cornerC.y = Math.round(this._cornerC.y);
        this._cornerD.x = Math.round(this._cornerD.x);
        this._cornerD.y = Math.round(this._cornerD.y);

        // Calculate bounding box
        const minX = Math.min(this._cornerA.x, this._cornerB.x, this._cornerC.x, this._cornerD.x);
        const maxX = Math.max(this._cornerA.x, this._cornerB.x, this._cornerC.x, this._cornerD.x);
        const minY = Math.min(this._cornerA.y, this._cornerB.y, this._cornerC.y, this._cornerD.y);
        const maxY = Math.max(this._cornerA.y, this._cornerB.y, this._cornerC.y, this._cornerD.y);

        // Normalize to bounding box origin
        this._offset.x -= minX;
        this._cornerA.x -= minX;
        this._cornerB.x -= minX;
        this._cornerC.x -= minX;
        this._cornerD.x -= minX;

        this._offset.y -= minY;
        this._cornerA.y -= minY;
        this._cornerB.y -= minY;
        this._cornerC.y -= minY;
        this._cornerD.y -= minY;

        this._width = maxX - minX;
        this._height = maxY - minY;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::getTextureIdentifier()
    private getTextureIdentifier(geometry: IRoomGeometry): string
    {
        return String(geometry.scale);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::needsNewTexture()
    private needsNewTexture(geometry: IRoomGeometry): boolean
    {
        if(this._width > 0 && this._height > 0)
        {
            const id = this.getTextureIdentifier(geometry);
            return !this._textureCache.has(id);
        }
        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::getTexture()
    private getTexture(geometry: IRoomGeometry, _time: number): HTMLCanvasElement | null
    {
        const id = this.getTextureIdentifier(geometry);

        if(this.needsNewTexture(geometry))
        {
            const texWidth = Math.max(1, Math.round(this._leftSide.length * geometry.scale));
            const texHeight = Math.max(1, Math.round(this._rightSide.length * geometry.scale));

            let texture = this._textureCache.get(id) ?? null;

            if(texture === null)
            {
                texture = document.createElement('canvas');
                texture.width = texWidth;
                texture.height = texHeight;

                const ctx = texture.getContext('2d')!;
                const r = (this._color >> 16) & 0xFF;
                const g = (this._color >> 8) & 0xFF;
                const b = this._color & 0xFF;
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(0, 0, texWidth, texHeight);

                this._textureCache.set(id, texture);
            }

            return texture;
        }

        return this._textureCache.get(id) ?? null;
    }

    /**
	 * Render a texture onto the plane using matrix transformation.
	 *
	 * Uses the four corner positions to compute an affine transform
	 * that maps the texture onto the perspective-projected plane.
	 *
	 * @see AS3 FurniturePlane.renderTexture()
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::renderTexture()
    private renderTexture(texture: HTMLCanvasElement): void
    {
        if(this._bitmapData === null || texture === null) return;

        // Compute transform matrix from cornerC (origin) to other corners
        let dx = this._cornerD.x - this._cornerC.x;
        let dy = this._cornerD.y - this._cornerC.y;
        let bx = this._cornerB.x - this._cornerC.x;
        let by = this._cornerB.y - this._cornerC.y;

        // Snap near-integer values to avoid sub-pixel artifacts
        if(Math.abs(bx - texture.width) <= 1) bx = texture.width;
        if(Math.abs(by - texture.width) <= 1) by = texture.width;
        if(Math.abs(dx - texture.height) <= 1) dx = texture.height;
        if(Math.abs(dy - texture.height) <= 1) dy = texture.height;

        // Build 2D affine matrix
        const a = bx / texture.width;
        const b = by / texture.width;
        const c = dx / texture.height;
        const d = dy / texture.height;

        const ctx = this._bitmapData.getContext('2d')!;
        ctx.save();
        ctx.setTransform(a, b, c, d, this._cornerC.x, this._cornerC.y);
        ctx.drawImage(texture, 0, 0);
        ctx.restore();
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlane.as::resetTextureCache()
    private resetTextureCache(): void
    {
        this._textureCache.clear();
    }
}
