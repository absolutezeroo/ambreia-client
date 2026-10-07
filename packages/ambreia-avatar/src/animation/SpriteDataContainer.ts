import type {IAnimation} from './IAnimation';
import type {ISpriteDataContainer} from './ISpriteDataContainer';

/**
 * Container for sprite data used in avatar animations.
 *
 * @see sources/win63_version/habbo/avatar/animation/SpriteDataContainer.as
 */
export class SpriteDataContainer implements ISpriteDataContainer
{
    private _directionOffsetX: number[];
    private _directionOffsetY: number[];
    private _directionOffsetZ: number[];

    constructor(animation: IAnimation, data: any)
    {
        this._animation = animation;
        this._id = String(data.id || '');
        this._ink = parseInt(data.ink) || 0;
        this._member = String(data.member || '');
        this._hasStaticY = Boolean(parseInt(data.staticY));
        this._hasDirections = Boolean(parseInt(data.directions));
        this._directionOffsetX = [];
        this._directionOffsetY = [];
        this._directionOffsetZ = [];

        if(data.directionList)
        {
            for(const dir of data.directionList)
            {
                const dirId = parseInt(dir.id) || 0;

                this._directionOffsetX[dirId] = parseInt(dir.dx) || 0;
                this._directionOffsetY[dirId] = parseInt(dir.dy) || 0;
                this._directionOffsetZ[dirId] = parseInt(dir.dz) || 0;
            }
        }
    }

    private _animation: IAnimation;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/SpriteDataContainer.as::get animation()
    public get animation(): IAnimation
    {
        return this._animation;
    }

    private _id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/SpriteDataContainer.as::get id()
    public get id(): string
    {
        return this._id;
    }

    private _ink: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/SpriteDataContainer.as::get ink()
    public get ink(): number
    {
        return this._ink;
    }

    private _member: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/SpriteDataContainer.as::get member()
    public get member(): string
    {
        return this._member;
    }

    private _hasDirections: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/SpriteDataContainer.as::get hasDirections()
    public get hasDirections(): boolean
    {
        return this._hasDirections;
    }

    private _hasStaticY: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/SpriteDataContainer.as::get hasStaticY()
    public get hasStaticY(): boolean
    {
        return this._hasStaticY;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/SpriteDataContainer.as::getDirectionOffsetX()
    public getDirectionOffsetX(direction: number): number
    {
        if(direction < this._directionOffsetX.length)
        {
            return this._directionOffsetX[direction] || 0;
        }

        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/SpriteDataContainer.as::getDirectionOffsetY()
    public getDirectionOffsetY(direction: number): number
    {
        if(direction < this._directionOffsetY.length)
        {
            return this._directionOffsetY[direction] || 0;
        }

        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/SpriteDataContainer.as::getDirectionOffsetZ()
    public getDirectionOffsetZ(direction: number): number
    {
        if(direction < this._directionOffsetZ.length)
        {
            return this._directionOffsetZ[direction] || 0;
        }

        return 0;
    }
}
