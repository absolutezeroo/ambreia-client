import {inside} from '../zone/zoneGeometry';
import type {IEditorCommand} from './IEditorCommand';

export const moveDoor = (x: number, y: number, direction?: number): IEditorCommand => ({
    label: `Porte en (${x},${y})`,
    apply: doc =>
    {
        const floor = doc.floor;
        const dir = direction ?? floor.doorDirection;

        if(!inside(floor, x, y) || (floor.door.x === x && floor.door.y === y && dir === floor.doorDirection))
        {
            return doc;
        }

        return {...doc, floor: {...floor, door: {x, y}, doorDirection: dir}};
    }
});
