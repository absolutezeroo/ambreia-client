/**
 * The light furni give, read from their own files: the pack build (vortex-client/tools/furni-lights.ts)
 * writes a `lights` entry in a furni's manifest, and RoomContentLoader hands it here when the furni
 * loads. It is keyed by image: the image a furni shows (its direction, state and animation frame)
 * says how it lights, so a TV lights only while its screen is on, the way its screen flickers, and
 * a fire as its flames burn.
 */

/** How one image of a furni lights, from where it is drawn. */
export interface IFurnitureLightFrame
{
    /** 0xRRGGBB. */
    color: number;
    /** 0..1: how bright the image is against the brightest of its direction; scales the intensity. */
    level: number;
    /** Where the light is, in tiles from the furni's origin (its tile, on the floor). */
    x: number;
    y: number;
    z: number;
}

/** A furni's lights, as its manifest's `lights` holds them. */
export interface IFurnitureLightData
{
    radius: number;
    intensity: number;
    /** 0..1: a light that faces the furni's front (a screen): 0 lights the half in front, 0.7 a narrow cone. Absent: all round. */
    spread?: number;
    /** By image name. */
    frames: Record<string, IFurnitureLightFrame>;
}

/** A frame with the light of the furni it belongs to. */
export interface IFurnitureLight extends IFurnitureLightFrame
{
    radius: number;
    intensity: number;
    spread: number | null;
}

const BY_IMAGE: Map<string, IFurnitureLight> = new Map();

export const FurnitureLights = {
    /** Takes a manifest's `lights`; anything else is ignored. */
    register(data: unknown): void
    {
        const lights = data as IFurnitureLightData | null;

        if(lights === null || typeof lights !== 'object' || typeof lights.frames !== 'object' || lights.frames === null) return;

        for(const [image, frame] of Object.entries(lights.frames))
        {
            BY_IMAGE.set(image, {...frame, radius: lights.radius, intensity: lights.intensity, spread: lights.spread ?? null});
        }
    },

    /** How the image `name` lights, or null when it gives no light; a small (32) image as its 64 twin. */
    lightOf(name: string | null): IFurnitureLight | null
    {
        if(name === null || BY_IMAGE.size === 0) return null;

        return BY_IMAGE.get(name) ?? BY_IMAGE.get(name.replace(/_32_([a-z])_(\d+)_(\d+)$/, '_64_$1_$2_$3')) ?? null;
    },

    /** True when some furni loaded so far declares its lights. */
    get any(): boolean
    {
        return BY_IMAGE.size > 0;
    }
};
