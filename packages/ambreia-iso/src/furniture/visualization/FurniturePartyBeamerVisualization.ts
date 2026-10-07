/**
 * FurniturePartyBeamerVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurniturePartyBeamerVisualization
 *
 * Party beamer with wobbling beam spots on sprites 2 and 3.
 */
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurniturePartyBeamerVisualization extends AnimatedFurnitureVisualization
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePartyBeamerVisualization.as::AREA_DIAMETER_SMALL
    private static readonly AREA_DIAMETER_SMALL: number = 15;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePartyBeamerVisualization.as::AREA_DIAMETER_LARGE
    private static readonly AREA_DIAMETER_LARGE: number = 31;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePartyBeamerVisualization.as::ANIM_SPEED_FAST
    private static readonly ANIM_SPEED_FAST: number = 2;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurniturePartyBeamerVisualization.as::ANIM_SPEED_SLOW
    private static readonly ANIM_SPEED_SLOW: number = 1;

    private _positions: number[] | null = null;
    private _directions: number[] | null = null;
    private _speeds: number[] | null = null;
    private _amplitudes: number[] | null = null;
    private _offsets: { x: number; y: number }[] = [];

    protected override updateAnimation(scale: number): number
    {
        if(this._speeds === null)
        {
            this.initItems(scale);
        }

        if(this.getSprite(2) !== null)
        {
            this._offsets[0] = this.getNewPoint(scale, 0);
        }

        if(this.getSprite(3) !== null)
        {
            this._offsets[1] = this.getNewPoint(scale, 1);
        }

        return super.updateAnimation(scale);
    }

    protected override getSpriteXOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(layerIndex === 2 || layerIndex === 3)
        {
            if(this._offsets.length === 2)
            {
                return this._offsets[layerIndex - 2].x;
            }
        }

        return super.getSpriteXOffset(scale, direction, layerIndex);
    }

    protected override getSpriteYOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(layerIndex === 2 || layerIndex === 3)
        {
            if(this._offsets.length === 2)
            {
                return this._offsets[layerIndex - 2].y;
            }
        }

        return super.getSpriteYOffset(scale, direction, layerIndex);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePartyBeamerVisualization.as::getNewPoint()
    private getNewPoint(scale: number, index: number): { x: number; y: number }
    {
        let position = this._positions![index];
        let dir = this._directions![index];
        const speed = this._speeds![index];
        const amplitude = this._amplitudes![index];

        let speedMultiplier = 1;
        let diameter: number;

        if(scale === 32)
        {
            diameter = FurniturePartyBeamerVisualization.AREA_DIAMETER_SMALL;
            speedMultiplier = 0.5;
        }
        else
        {
            diameter = FurniturePartyBeamerVisualization.AREA_DIAMETER_LARGE;
        }

        const newPos = position + dir * speed;

        if(Math.abs(newPos) >= diameter)
        {
            if(dir > 0)
            {
                position -= newPos - diameter;
            }
            else
            {
                position += -diameter - newPos;
            }

            dir = -dir;
            this._directions![index] = dir;
        }

        const remaining = (diameter - Math.abs(position)) * amplitude;
        let yOffset = dir * Math.sin(Math.abs(position / 4)) * remaining;

        if(dir > 0)
        {
            yOffset -= remaining;
        }
        else
        {
            yOffset += remaining;
        }

        position += dir * speed * speedMultiplier;
        this._positions![index] = position;

        if(Math.trunc(yOffset) === 0)
        {
            this._amplitudes![index] = this.getRandomAmplitudeFactor();
        }

        return {x: position, y: yOffset};
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePartyBeamerVisualization.as::initItems()
    private initItems(scale: number): void
    {
        let diameter: number;

        if(scale === 32)
        {
            diameter = FurniturePartyBeamerVisualization.AREA_DIAMETER_SMALL;
        }
        else
        {
            diameter = FurniturePartyBeamerVisualization.AREA_DIAMETER_LARGE;
        }

        this._positions = [
            Math.random() * diameter * 1.5,
            Math.random() * diameter * 1.5
        ];

        this._directions = [1, -1];

        this._speeds = [
            FurniturePartyBeamerVisualization.ANIM_SPEED_FAST,
            FurniturePartyBeamerVisualization.ANIM_SPEED_SLOW
        ];

        this._amplitudes = [
            this.getRandomAmplitudeFactor(),
            this.getRandomAmplitudeFactor()
        ];
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurniturePartyBeamerVisualization.as::getRandomAmplitudeFactor()
    private getRandomAmplitudeFactor(): number
    {
        return Math.random() * 30 / 100 + 0.15;
    }
}
