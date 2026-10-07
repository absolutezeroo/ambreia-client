import {Vector3d} from '../../utils/Vector3d';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';
import {FurniturePlanetSystemVisualizationPlanetObject} from './FurniturePlanetSystemVisualizationPlanetObject';
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

/**
 * A planet-system furni — a mobile of orbiting bodies, one sprite each. The layout comes out of the
 * furni's own data as a `<planetsystem>` subtree, stored on the model by `FurniturePlanetSystemLogic`
 * as the string this class parses: one node per body, with `name`, `parent`, `radius`, `arcspeed`,
 * `arcoffset` and `height` attributes. A node naming a `parent` becomes that body's moon.
 *
 * Each frame every root body advances its orbit and writes its projected offset into the shared
 * offset array at its own sprite index; `getSpriteXOffset()` and its siblings then read the array
 * instead of the animation's frame offsets, which is how the sprites move without an animation.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlanetSystemVisualization.as
 */
export class FurniturePlanetSystemVisualization extends AnimatedFurnitureVisualization
{
    // TS-only: AS3 inlines the 31 — the number of sprites that fit in the int mask it returns.
    private static readonly MAX_UPDATED_SPRITES: number = 31;

    // The root bodies. Name DERIVED — `_SafeStr_5087` is obfuscated in every tree.
    // AS3: .../FurniturePlanetSystemVisualization.as::_SafeStr_5087
    private _planets: FurniturePlanetSystemVisualizationPlanetObject[] | null = null;

    // Their names, pushed alongside and read by nothing — AS3 keeps the list and never queries it.
    // Name DERIVED — `_SafeStr_8184`.
    // AS3: .../FurniturePlanetSystemVisualization.as::_SafeStr_8184
    private _planetNames: string[] | null = null;

    // AS3: .../FurniturePlanetSystemVisualization.as::_offsetArray
    private _offsetArray: Vector3d[] = [];

    // The system's origin, left at (0,0,0) — AS3 constructs it and never writes to it, so adding it
    // to a root body's position is a no-op. Name DERIVED — `_SafeStr_8990`.
    // AS3: .../FurniturePlanetSystemVisualization.as::_SafeStr_8990
    private _origin: Vector3d = new Vector3d(0, 0, 0);

    // AS3: .../FurniturePlanetSystemVisualization.as::updateAnimation()
    protected override updateAnimation(scale: number): number
    {
        if(this._planets === null && this.spriteCount > 0)
        {
            if(!this.readDefinition()) return 0;
        }

        if(this._planets === null) return 0;

        for(const planet of this._planets)
        {
            planet.update(this._offsetArray, this._origin, scale);
        }

        let result = super.updateAnimation(scale);
        const count = Math.min(this._offsetArray.length, FurniturePlanetSystemVisualization.MAX_UPDATED_SPRITES);

        for(let i = 0; i < count; i++)
        {
            result |= 1 << i;
        }

        return result;
    }

    // AS3: .../FurniturePlanetSystemVisualization.as::getSpriteXOffset()
    protected override getSpriteXOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(layerIndex < this._offsetArray.length) return this._offsetArray[layerIndex].x;

        return super.getSpriteXOffset(scale, direction, layerIndex);
    }

    // AS3: .../FurniturePlanetSystemVisualization.as::getSpriteYOffset()
    protected override getSpriteYOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(layerIndex < this._offsetArray.length) return this._offsetArray[layerIndex].y;

        return super.getSpriteYOffset(scale, direction, layerIndex);
    }

    // AS3: .../FurniturePlanetSystemVisualization.as::getSpriteZOffset()
    protected override getSpriteZOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(layerIndex < this._offsetArray.length) return this._offsetArray[layerIndex].z;

        return super.getSpriteZOffset(scale, direction, layerIndex);
    }

    /**
     * AS3 wraps the model string in an `XMLList` and walks its children; `DOMParser` needs a single
     * root, and the stored string is the serialized `<planetsystem>` element, so it already has one.
     *
     * Returns true even when the string is empty or unparseable — `_planets` becomes `[]` and the
     * definition is never re-read, which is AS3's behaviour too.
     */
    // AS3: .../FurniturePlanetSystemVisualization.as::readDefinition()
    private readDefinition(): boolean
    {
        const object = this.object;

        if(object === null) return false;

        const model = object.getModel();

        if(model === null) return false;

        this._planets = [];
        this._planetNames = [];

        const data = model.getString(RoomObjectVariableEnum.FURNITURE_PLANETSYSTEM_DATA);

        if(!data) return true;

        const document = new DOMParser().parseFromString(data, 'text/xml');
        const nodes = document.documentElement?.children ?? [];

        for(let i = 0; i < nodes.length; i++)
        {
            const node = nodes[i];

            this.addPlanet(
                node.getAttribute('name') ?? '',
                i,
                node.getAttribute('parent') ?? '',
                Number(node.getAttribute('radius')),
                Number(node.getAttribute('arcspeed')),
                Number(node.getAttribute('arcoffset')),
                Number(node.getAttribute('height'))
            );
        }

        return true;
    }

    // AS3: .../FurniturePlanetSystemVisualization.as::addPlanet()
    private addPlanet(
        name: string,
        index: number,
        parentName: string,
        radius: number,
        arcSpeed: number,
        arcOffset: number,
        height: number
    ): void
    {
        if(this._planets === null) return;

        const planet = new FurniturePlanetSystemVisualizationPlanetObject(name, index, radius, arcSpeed, arcOffset, height);
        const parent = this.getPlanet(parentName);

        if(parent !== null)
        {
            parent.addChild(planet);
        }
        else
        {
            this._planets.push(planet);
            this._planetNames?.push(name);
        }
    }

    // AS3: .../FurniturePlanetSystemVisualization.as::getPlanet()
    private getPlanet(name: string): FurniturePlanetSystemVisualizationPlanetObject | null
    {
        for(const planet of this._planets ?? [])
        {
            if(planet.name === name) return planet;

            if(planet.hasChild(name)) return planet.getChild(name);
        }

        return null;
    }

    /**
     * AS3 does not chain to `super.dispose()` here. Kept, because the base class's teardown running
     * twice — the room engine disposes visualizations through the same path it disposes their
     * objects — is the failure this omission avoids in Flash.
     */
    // AS3: .../FurniturePlanetSystemVisualization.as::dispose()
    override dispose(): void
    {
        if(this._planets !== null)
        {
            while(this._planets.length > 0)
            {
                this._planets.shift()?.dispose();
            }
        }

        this._planets = null;
        this._planetNames = null;
    }
}
