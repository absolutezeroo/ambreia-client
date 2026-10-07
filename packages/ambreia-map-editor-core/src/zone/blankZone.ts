import type {ZoneDocument} from './Zone.generated';

/** A flat open floor with the door on the left edge: what a new zone starts from. */
export function blankZone(key: string, name: string, width = 12, length = 12): ZoneDocument
{
    return {
        schemaVersion: 1,
        settings: {id: key, name},
        floor: {
            width,
            length,
            tiles: Array.from({length: width * length}, () => ({})),
            door: {x: 0, y: Math.floor(length / 2)},
            doorDirection: 2
        }
    };
}
