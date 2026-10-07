import {Vector3d} from '../../utils/Vector3d';

/**
 * One body in a planet-system furni: a name, an orbit (radius, angular speed, starting angle) and a
 * height, plus any moons hanging off it. `update()` advances its own angle, writes its screen offset
 * into the shared offset array at its sprite index, and recurses into its children with its own
 * position as their origin — which is what makes a moon orbit its planet rather than the sun.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurniturePlanetSystemVisualizationPlanetObject.as
 */
export class FurniturePlanetSystemVisualizationPlanetObject
{
    // Declared and never read in AS3 — the per-frame step below divides by a literal 30 instead.
    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::SYSTEM_TEMPO
    private static readonly SYSTEM_TEMPO: number = 30;

    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::_index
    private _index: number;

    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::_name
    private _name: string;

    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::_radius
    private _radius: number;

    // Radians per tick. Name DERIVED — `_SafeStr_9231`; the constructor converts `arcspeed` degrees.
    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::_SafeStr_9231
    private _arcSpeed: number;

    // The starting angle, likewise converted from `arcoffset` degrees. Name DERIVED — `_SafeStr_8515`.
    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::_SafeStr_8515
    private _arcOffset: number;

    // Name DERIVED — `_SafeStr_4970`, the body's height above the system's plane.
    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::_SafeStr_4970
    private _height: number;

    // The accumulated angle. Name DERIVED — `_SafeStr_6812`.
    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::_SafeStr_6812
    private _arc: number = 0;

    // Reused across frames, exactly as AS3 does: `getPositionVector()` returns this instance rather
    // than a fresh one, and the offset array holds the reference. Name DERIVED — `_SafeStr_6451`.
    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::_SafeStr_6451
    private _position: Vector3d = new Vector3d(0, 0, 0);

    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::_children
    private _children: FurniturePlanetSystemVisualizationPlanetObject[] = [];

    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::FurniturePlanetSystemVisualizationPlanetObject()
    constructor(name: string, index: number, radius: number, arcSpeed: number, arcOffset: number, height: number)
    {
        this._name = name;
        this._index = index;
        this._radius = radius;
        this._arcSpeed = (arcSpeed * Math.PI * 2) / 360;
        this._arcOffset = (arcOffset * Math.PI * 2) / 360;
        this._height = height;
    }

    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::get name()
    get name(): string
    {
        return this._name;
    }

    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::update()
    update(offsets: Vector3d[], origin: Vector3d | null, scale: number): void
    {
        this._arc += this._arcSpeed / FurniturePlanetSystemVisualizationPlanetObject.SYSTEM_TEMPO;
        offsets[this._index] = this.getPositionVector(origin, scale);

        for(const child of this._children)
        {
            child.update(offsets, this._position, scale);
        }
    }

    /**
     * The isometric projection AS3 writes verbatim. `z` is `-(int(...))` — an AS3 `int()` cast,
     * which truncates toward zero rather than flooring, so a negative product rounds the other way
     * than `Math.floor` would; `Math.trunc` is the faithful one.
     */
    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::getPositionVector()
    getPositionVector(origin: Vector3d | null, scale: number): Vector3d
    {
        const cos = this._radius * Math.cos(this._arc + this._arcOffset);
        const sin = this._radius * Math.sin(this._arc + this._arcOffset);

        this._position.x = (cos - sin) * (scale / 2);
        this._position.y = (sin + cos) * (scale / 2) * 0.5 - this._height * (scale / 2);
        this._position.z = -(Math.trunc(4 * (cos + sin) - 0.7));

        if(origin !== null) this._position.add(origin);

        return this._position;
    }

    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::addChild()
    addChild(child: FurniturePlanetSystemVisualizationPlanetObject): void
    {
        if(this._children.indexOf(child) < 0) this._children.push(child);
    }

    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::hasChild()
    hasChild(name: string): boolean
    {
        for(const child of this._children)
        {
            if(child.name === name) return true;

            if(child.hasChild(name)) return true;
        }

        return false;
    }

    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::getChild()
    getChild(name: string): FurniturePlanetSystemVisualizationPlanetObject | null
    {
        for(const child of this._children)
        {
            if(child.name === name) return child;

            if(child.hasChild(name)) return child.getChild(name);
        }

        return null;
    }

    // AS3: .../FurniturePlanetSystemVisualizationPlanetObject.as::dispose()
    dispose(): void
    {
        while(this._children.length > 0)
        {
            this._children.shift()?.dispose();
        }
    }
}
