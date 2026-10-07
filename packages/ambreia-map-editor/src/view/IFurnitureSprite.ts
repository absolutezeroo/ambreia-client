/** A furni as the room draws it, with the point of its image that sits on its tile centre. */
export interface IFurnitureSprite
{
    readonly image: HTMLImageElement;
    readonly anchorX: number;
    readonly anchorY: number;
    /** Alpha of each pixel, for picking on the drawn shape rather than its box. */
    readonly alpha: Uint8ClampedArray;
}
